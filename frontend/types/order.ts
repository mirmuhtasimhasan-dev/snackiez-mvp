import type { PaymentMethod, Prisma } from "@prisma/client";

// Types shared by order code. Kept out of "use server" files, which may only
// export async functions: the server-actions compiler turns every export of
// such a file into a runtime reference, so even a type re-export crashes.

// The relations every order query loads. lib/order-status.ts builds the
// matching `orderInclude` value with `satisfies OrderDetailsInclude`, so the
// two cannot drift apart.
export type OrderDetailsInclude = {
  customer: true;
  items: { include: { menuItem: true } };
  payment: true;
};

export type OrderWithDetails = Prisma.OrderGetPayload<{ include: OrderDetailsInclude }>;

export type CreateOrderInput = {
  customerName: string;
  phone: string;
  address?: string;
  note?: string;
  items: { menuItemId: string; quantity: number }[];
  paymentMethod?: PaymentMethod;
  trxId?: string;
  senderNumber?: string;
};
