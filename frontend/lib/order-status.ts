import { OrderStatus, PaymentMethod, PaymentStatus } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { ActionError } from "@/lib/action-result";
import type { OrderDetailsInclude, OrderWithDetails } from "@/types/order";

// Shared by the admin Server Action and the Telegram webhook, so both paths
// apply exactly the same stock and payment rules. Callers must authorize
// the request first; this module does no auth of its own.

export const orderInclude = {
  customer: true,
  items: { include: { menuItem: true } },
  payment: true,
} satisfies OrderDetailsInclude;

// Leaving PENDING for any of these means the kitchen accepted the order,
// which is when stock is deducted.
export const ACCEPTED_STATUSES: OrderStatus[] = [
  OrderStatus.CONFIRMED,
  OrderStatus.PREPARING,
  OrderStatus.DELIVERED,
];

export function sumQuantities(items: { menuItemId: string; quantity: number }[]) {
  const totals = new Map<string, number>();

  for (const item of items) {
    totals.set(item.menuItemId, (totals.get(item.menuItemId) ?? 0) + item.quantity);
  }

  return totals;
}

type ChangeOptions = {
  // Reject the change unless the order is still in this status. Used by
  // Telegram buttons, which can be pressed long after they were sent.
  expectedStatus?: OrderStatus;
};

export async function changeOrderStatus(
  id: string,
  status: OrderStatus,
  options: ChangeOptions = {}
): Promise<OrderWithDetails> {
  if (!Object.values(OrderStatus).includes(status)) {
    throw new ActionError("Invalid order status");
  }

  return prisma.$transaction(async (tx) => {
    const current = await tx.order.findUnique({
      where: { id },
      include: orderInclude,
    });

    if (!current) {
      throw new ActionError("Order not found");
    }

    if (options.expectedStatus && current.status !== options.expectedStatus) {
      throw new ActionError(`Order is already ${current.status.toLowerCase()}`);
    }

    if (current.status === status) {
      return current;
    }

    if (current.status === OrderStatus.CANCELLED) {
      throw new ActionError("Cancelled orders cannot be changed");
    }

    // Guard against two admins changing the same order at once, which
    // would otherwise deduct stock twice.
    const claimed = await tx.order.updateMany({
      where: { id, status: current.status },
      data: { status },
    });

    if (claimed.count === 0) {
      throw new ActionError("Order was updated by someone else. Please refresh.");
    }

    if (current.status === OrderStatus.PENDING && ACCEPTED_STATUSES.includes(status)) {
      const quantities = sumQuantities(current.items);

      for (const [menuItemId, quantity] of quantities) {
        const updated = await tx.menuItem.updateMany({
          where: { id: menuItemId, stockQty: { gte: quantity } },
          data: { stockQty: { decrement: quantity } },
        });

        if (updated.count === 0) {
          const name =
            current.items.find((item) => item.menuItemId === menuItemId)?.menuItem.name ??
            "an item";
          throw new ActionError(`Not enough stock for ${name}`);
        }
      }

      await tx.menuItem.updateMany({
        where: { id: { in: [...quantities.keys()] }, stockQty: { lte: 0 } },
        data: { isAvailable: false },
      });
    }

    // Cancelling an order whose stock was already deducted puts it back.
    // Items that had sold out (stock 0) become available again.
    if (status === OrderStatus.CANCELLED && ACCEPTED_STATUSES.includes(current.status)) {
      const quantities = sumQuantities(current.items);
      const soldOutIds = current.items
        .filter((item) => item.menuItem.stockQty <= 0)
        .map((item) => item.menuItemId);

      for (const [menuItemId, quantity] of quantities) {
        await tx.menuItem.update({
          where: { id: menuItemId },
          data: { stockQty: { increment: quantity } },
        });
      }

      if (soldOutIds.length > 0) {
        await tx.menuItem.updateMany({
          where: { id: { in: soldOutIds }, stockQty: { gt: 0 } },
          data: { isAvailable: true },
        });
      }
    }

    // Cash on delivery is collected at the door.
    if (
      status === OrderStatus.DELIVERED &&
      current.payment?.method === PaymentMethod.CASH &&
      current.payment.status !== PaymentStatus.PAID
    ) {
      await tx.payment.update({
        where: { orderId: id },
        data: { status: PaymentStatus.PAID },
      });
    }

    return tx.order.findUniqueOrThrow({ where: { id }, include: orderInclude });
  });
}
