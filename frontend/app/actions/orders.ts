"use server";

import { revalidatePath, updateTag } from "next/cache";
import { after } from "next/server";
import { PaymentMethod, Prisma } from "@prisma/client";
import type { OrderStatus } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { requireAdmin } from "@/lib/auth";
import { ActionError, toErrorResult } from "@/lib/action-result";
import type { ActionResult } from "@/lib/action-result";
import {
  BD_PHONE_PATTERN,
  BKASH_TRX_ID_PATTERN,
  generateOrderCode,
  getBkashNumber,
  normalizeBdPhone,
} from "@/lib/order-config";
import {
  changeOrderStatus,
  orderInclude,
  sumQuantities,
} from "@/lib/order-status";
import { notifyNewOrder, syncOrderMessage } from "@/lib/order-telegram";
import { readSiteSettings } from "@/lib/settings";
import { CACHE_TAGS } from "@/lib/site-data";
import { isStoreOpen } from "@/lib/store-hours";
import type { CreateOrderInput, OrderWithDetails } from "@/types/order";

function isUniqueViolation(error: unknown, field: string) {
  return (
    error instanceof Prisma.PrismaClientKnownRequestError &&
    error.code === "P2002" &&
    JSON.stringify(error.meta?.target ?? "").includes(field)
  );
}

export async function createOrder(
  input: CreateOrderInput
): Promise<ActionResult<OrderWithDetails>> {
  try {
    // Read fresh (not cached): the store may have just been closed, and the
    // fee saved on the order must be the current one.
    const settings = await readSiteSettings();

    if (!isStoreOpen(settings)) {
      throw new ActionError(settings.closedMessage);
    }

    const { customerName, address, note, items } = input ?? {};
    const phone = normalizeBdPhone(input?.phone ?? "");
    const paymentMethod = input?.paymentMethod ?? PaymentMethod.CASH;

    if (
      !customerName?.trim() ||
      !phone ||
      !address?.trim() ||
      !Array.isArray(items) ||
      items.length === 0
    ) {
      throw new ActionError("Name, phone, delivery address and items are required");
    }

    if (!BD_PHONE_PATTERN.test(phone)) {
      throw new ActionError("Please enter a valid Bangladeshi mobile number, e.g. 01712345678");
    }

    if (!Object.values(PaymentMethod).includes(paymentMethod)) {
      throw new ActionError("Invalid payment method");
    }

    for (const item of items) {
      const quantity = Number(item?.quantity);

      if (!item?.menuItemId || !Number.isInteger(quantity) || quantity <= 0) {
        throw new ActionError("Each item must have a valid menuItemId and quantity");
      }
    }

    let trxId: string | null = null;
    let senderNumber: string | null = null;

    if (paymentMethod === PaymentMethod.BKASH) {
      if (!getBkashNumber()) {
        throw new ActionError("bKash payment is not available right now. Please choose Cash on Delivery.");
      }

      trxId = input.trxId?.trim().toUpperCase() || null;
      senderNumber = normalizeBdPhone(input.senderNumber ?? "") || null;

      if (!trxId || !senderNumber) {
        throw new ActionError("bKash Transaction ID and sender number are required");
      }

      if (!BKASH_TRX_ID_PATTERN.test(trxId)) {
        throw new ActionError("Please enter a valid bKash Transaction ID");
      }

      if (!BD_PHONE_PATTERN.test(senderNumber)) {
        throw new ActionError("Please enter a valid 11-digit bKash sender number");
      }

      const existingPayment = await prisma.payment.findFirst({ where: { trxId } });

      if (existingPayment) {
        throw new ActionError("This bKash Transaction ID has already been used");
      }
    }

    const normalizedItems = items.map((item) => ({
      menuItemId: item.menuItemId,
      quantity: Number(item.quantity),
    }));
    const requestedQuantities = sumQuantities(normalizedItems);
    const menuItemIds = [...requestedQuantities.keys()];

    const menuItems = await prisma.menuItem.findMany({
      where: { id: { in: menuItemIds } },
    });

    if (menuItems.length !== menuItemIds.length) {
      throw new ActionError("One or more menu items were not found");
    }

    for (const menuItem of menuItems) {
      if (!menuItem.isAvailable) {
        throw new ActionError(`${menuItem.name} is currently unavailable`);
      }

      if (menuItem.stockQty < (requestedQuantities.get(menuItem.id) ?? 0)) {
        throw new ActionError(
          `Only ${menuItem.stockQty} ${menuItem.name} left in stock`
        );
      }
    }

    let subtotal = 0;

    const orderItemsData = normalizedItems.map((item) => {
      const menuItem = menuItems.find((menuItem) => menuItem.id === item.menuItemId)!;
      const price = Number(menuItem.price);

      subtotal += price * item.quantity;

      return { menuItemId: item.menuItemId, quantity: item.quantity, price };
    });

    const deliveryFee = settings.deliveryFee;
    const totalAmount = subtotal + deliveryFee;

    // Retry on the rare order code collision.
    for (let attempt = 0; ; attempt++) {
      try {
        const order = await prisma.order.create({
          data: {
            orderCode: generateOrderCode(),
            customer: {
              create: {
                name: customerName.trim(),
                phone,
                address: address.trim(),
              },
            },
            totalAmount,
            deliveryFee,
            note: note?.trim() || null,
            items: { create: orderItemsData },
            payment: {
              create: {
                method: paymentMethod,
                amount: totalAmount,
                trxId,
                senderNumber,
              },
            },
          },
          include: orderInclude,
        });

        // Tell the kitchen on Telegram after the customer gets their response.
        // notifyNewOrder logs its own failures and never throws.
        after(() => notifyNewOrder(order.id));

        revalidatePath("/admin");
        return { success: true, message: "Order created successfully", data: order };
      } catch (error) {
        if (attempt < 4 && isUniqueViolation(error, "orderCode")) {
          continue;
        }

        throw error;
      }
    }
  } catch (error) {
    return toErrorResult(error, "Order creation failed");
  }
}

export async function getOrders(): Promise<ActionResult<OrderWithDetails[]>> {
  try {
    await requireAdmin();

    const orders = await prisma.order.findMany({
      include: orderInclude,
      orderBy: { createdAt: "desc" },
    });

    return { success: true, data: orders };
  } catch (error) {
    return toErrorResult(error, "Failed to fetch orders");
  }
}

export async function updateOrderStatus(
  id: string,
  status: OrderStatus
): Promise<ActionResult<OrderWithDetails>> {
  try {
    const admin = await requireAdmin();
    const previousStatus = (await prisma.order.findUnique({ where: { id }, select: { status: true } }))
      ?.status;

    const order = await changeOrderStatus(id, status);

    // Keep the kitchen's Telegram message in step. Runs after the response
    // and never affects the result.
    if (previousStatus !== order.status) {
      const change = { actor: `Admin panel (${admin.email ?? "admin"})`, at: new Date() };
      after(() => syncOrderMessage(order.id, change));
    }

    // Stock and sold-out status may have changed: expire the cached menu.
    updateTag(CACHE_TAGS.menu);

    revalidatePath("/admin");
    revalidatePath("/menu");
    revalidatePath("/");
    return { success: true, message: "Order status updated successfully", data: order };
  } catch (error) {
    return toErrorResult(error, "Order status update failed");
  }
}
