import { OrderStatus, PaymentMethod } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { orderInclude } from "@/lib/order-status";
import { editMessage, escapeHtml, sendMessage } from "@/lib/telegram";
import type { InlineKeyboard } from "@/lib/telegram";
import type { OrderWithDetails } from "@/types/order";

// Order notifications for the kitchen's Telegram group. Everything here is
// best effort: failures are logged and never reach the customer or admin.

const TIME_ZONE = "Asia/Dhaka";

// Callback data is "st:<orderId>:<from>:<to>" using one-letter status codes,
// well under Telegram's 64-byte limit.
const STATUS_CODES: Record<OrderStatus, string> = {
  PENDING: "P",
  CONFIRMED: "C",
  PREPARING: "R",
  DELIVERED: "D",
  CANCELLED: "X",
};
const CODE_TO_STATUS = Object.fromEntries(
  Object.entries(STATUS_CODES).map(([status, code]) => [code, status as OrderStatus])
) as Record<string, OrderStatus>;

const STATUS_LABELS: Record<OrderStatus, string> = {
  PENDING: "🟡 Pending",
  CONFIRMED: "✅ Confirmed",
  PREPARING: "👨‍🍳 Preparing",
  DELIVERED: "📦 Delivered",
  CANCELLED: "❌ Cancelled",
};

// Buttons offered in each status: [label, next status].
const NEXT_ACTIONS: Record<OrderStatus, [string, OrderStatus][]> = {
  PENDING: [
    ["✅ Confirm", OrderStatus.CONFIRMED],
    ["❌ Cancel", OrderStatus.CANCELLED],
  ],
  CONFIRMED: [
    ["👨‍🍳 Preparing", OrderStatus.PREPARING],
    ["❌ Cancel", OrderStatus.CANCELLED],
  ],
  PREPARING: [["📦 Delivered", OrderStatus.DELIVERED]],
  DELIVERED: [],
  CANCELLED: [],
};

export function encodeStatusAction(orderId: string, from: OrderStatus, to: OrderStatus) {
  return `st:${orderId}:${STATUS_CODES[from]}:${STATUS_CODES[to]}`;
}

export function decodeStatusAction(data: string | undefined) {
  const [prefix, orderId, fromCode, toCode] = (data ?? "").split(":");
  const from = CODE_TO_STATUS[fromCode];
  const to = CODE_TO_STATUS[toCode];

  if (prefix !== "st" || !orderId || !from || !to) {
    return null;
  }

  return { orderId, from, to };
}

export function statusLabel(status: OrderStatus) {
  return STATUS_LABELS[status];
}

function formatTime(date: Date) {
  return new Intl.DateTimeFormat("en-US", {
    timeZone: TIME_ZONE,
    day: "numeric",
    month: "short",
    year: "numeric",
    hour: "numeric",
    minute: "2-digit",
    hour12: true,
  }).format(date);
}

function tk(amount: number) {
  return `TK ${Number(amount).toLocaleString("en-US")}`;
}

// Telegram only accepts public https links in buttons.
function adminUrl() {
  const base =
    process.env.SITE_URL ||
    (process.env.VERCEL_PROJECT_PRODUCTION_URL
      ? `https://${process.env.VERCEL_PROJECT_PRODUCTION_URL}`
      : "");

  return base.startsWith("https://") ? `${base.replace(/\/$/, "")}/admin` : null;
}

function buildKeyboard(order: OrderWithDetails): InlineKeyboard {
  const actions = NEXT_ACTIONS[order.status];

  if (actions.length === 0) {
    return [];
  }

  const rows: InlineKeyboard = [
    actions.map(([text, next]) => ({
      text,
      callback_data: encodeStatusAction(order.id, order.status, next),
    })),
  ];

  // The admin link rides along with the first set of buttons only.
  const url = adminUrl();
  if (order.status === OrderStatus.PENDING && url) {
    rows.push([{ text: "🔗 Open in Admin", url }]);
  }

  return rows;
}

export type StatusChange = { actor: string; at: Date };

function buildText(order: OrderWithDetails, change?: StatusChange) {
  const e = escapeHtml;
  const subtotal = order.totalAmount - order.deliveryFee;
  const heading =
    order.status === OrderStatus.PENDING
      ? `🆕 <b>New order ${e(order.orderCode)}</b>`
      : `<b>Order ${e(order.orderCode)}</b>`;

  const lines = [
    heading,
    `🕒 ${formatTime(order.createdAt)}`,
    `<b>Status:</b> ${STATUS_LABELS[order.status]}`,
    "",
    `👤 ${e(order.customer.name)}`,
    `📞 ${e(order.customer.phone)}`,
    `📍 ${e(order.customer.address ?? "No address")}`,
  ];

  if (order.note) {
    lines.push(`📝 ${e(order.note)}`);
  }

  lines.push("", "<b>Items</b>");
  for (const item of order.items) {
    lines.push(
      `• ${item.quantity} × ${e(item.menuItem.name)} (${tk(item.price)}) = ${tk(item.price * item.quantity)}`
    );
  }

  lines.push(
    "",
    `Subtotal: ${tk(subtotal)}`,
    `Delivery: ${tk(order.deliveryFee)}`,
    `<b>Total: ${tk(order.totalAmount)}</b>`,
    ""
  );

  if (order.payment?.method === PaymentMethod.BKASH) {
    lines.push(
      `💳 <b>bKash</b> (${order.payment.status.toLowerCase()})`,
      `TrxID: <code>${e(order.payment.trxId ?? "-")}</code>`,
      `Sender: <code>${e(order.payment.senderNumber ?? "-")}</code>`
    );
  } else {
    lines.push(`💵 <b>Cash on Delivery</b> (${order.payment?.status.toLowerCase() ?? "unpaid"})`);
  }

  if (change) {
    lines.push("", `<i>${STATUS_LABELS[order.status]} by ${e(change.actor)} at ${formatTime(change.at)}</i>`);
  }

  return lines.join("\n");
}

/** Posts a new order to the group and remembers the message for later edits. */
export async function notifyNewOrder(orderId: string) {
  try {
    const order = await prisma.order.findUnique({ where: { id: orderId }, include: orderInclude });
    if (!order) return;

    const messageId = await sendMessage(buildText(order), { replyMarkup: buildKeyboard(order) });

    if (messageId !== null) {
      await prisma.order.update({ where: { id: orderId }, data: { telegramMessageId: messageId } });
    }
  } catch (error) {
    console.error(`[telegram] could not notify new order ${orderId}:`, error);
  }
}

/** Rewrites an order's group message to its current status and buttons. */
export async function syncOrderMessage(orderId: string, change?: StatusChange) {
  try {
    const order = await prisma.order.findUnique({ where: { id: orderId }, include: orderInclude });

    if (!order?.telegramMessageId) {
      return;
    }

    await editMessage(order.telegramMessageId, buildText(order, change), {
      replyMarkup: buildKeyboard(order),
    });
  } catch (error) {
    console.error(`[telegram] could not update message for order ${orderId}:`, error);
  }
}
