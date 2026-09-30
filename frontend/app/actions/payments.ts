"use server";

import { revalidatePath } from "next/cache";
import { OrderStatus, PaymentMethod, PaymentStatus } from "@prisma/client";
import type { Payment } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { requireAdmin } from "@/lib/auth";
import { ActionError, toErrorResult } from "@/lib/action-result";
import type { ActionResult } from "@/lib/action-result";

// The merchant bKash number customers send money to before checkout.
export async function getBkashNumber(): Promise<ActionResult<string>> {
  const bkashNumber = process.env.BKASH_NUMBER;

  if (!bkashNumber) {
    return { success: false, message: "bKash payment is not configured" };
  }

  return { success: true, data: bkashNumber };
}

export async function updatePaymentStatus(
  orderId: string,
  status: PaymentStatus
): Promise<ActionResult<Payment>> {
  try {
    await requireAdmin();

    if (!Object.values(PaymentStatus).includes(status)) {
      throw new ActionError("Invalid payment status");
    }

    const payment = await prisma.payment.findUnique({
      where: { orderId },
      include: { order: { select: { status: true } } },
    });

    if (!payment) {
      throw new ActionError("Payment not found");
    }

    if (
      payment.method === PaymentMethod.CASH &&
      status === PaymentStatus.PAID &&
      payment.order.status !== OrderStatus.DELIVERED
    ) {
      throw new ActionError("Cash on delivery orders stay unpaid until delivered");
    }

    const updated = await prisma.payment.update({
      where: { orderId },
      data: { status },
    });

    revalidatePath("/admin");
    return { success: true, message: "Payment status updated successfully", data: updated };
  } catch (error) {
    return toErrorResult(error, "Payment status update failed");
  }
}

// Admin checked the bKash app and found (or did not find) the transaction.
export async function verifyBkashPayment(
  orderId: string,
  isValid: boolean
): Promise<ActionResult<Payment>> {
  try {
    await requireAdmin();

    const payment = await prisma.payment.findUnique({ where: { orderId } });

    if (!payment) {
      throw new ActionError("Payment not found");
    }

    if (payment.method !== PaymentMethod.BKASH) {
      throw new ActionError("This order is not a bKash payment");
    }

    const updated = await prisma.payment.update({
      where: { orderId },
      data: { status: isValid ? PaymentStatus.PAID : PaymentStatus.FAILED },
    });

    revalidatePath("/admin");
    return {
      success: true,
      message: isValid ? "bKash payment verified" : "bKash payment marked as failed",
      data: updated,
    };
  } catch (error) {
    return toErrorResult(error, "bKash verification failed");
  }
}
