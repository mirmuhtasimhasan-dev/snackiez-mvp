import { timingSafeEqual } from "node:crypto";
import { revalidatePath } from "next/cache";
import { ActionError } from "@/lib/action-result";
import { changeOrderStatus } from "@/lib/order-status";
import { decodeStatusAction, statusLabel, syncOrderMessage } from "@/lib/order-telegram";
import { answerCallbackQuery } from "@/lib/telegram";

// Telegram calls this for button presses on order messages. Register it with
// setWebhook, passing TELEGRAM_WEBHOOK_SECRET as secret_token (the command
// is in .env.example).

type CallbackQuery = {
  id: string;
  data?: string;
  from: { id: number; first_name?: string; last_name?: string; username?: string };
};

function isAuthentic(request: Request) {
  const expected = process.env.TELEGRAM_WEBHOOK_SECRET;
  const received = request.headers.get("x-telegram-bot-api-secret-token");

  if (!expected || !received) {
    return false;
  }

  const a = Buffer.from(received);
  const b = Buffer.from(expected);
  return a.length === b.length && timingSafeEqual(a, b);
}

function displayName(from: CallbackQuery["from"]) {
  const name = [from.first_name, from.last_name].filter(Boolean).join(" ");
  if (name && from.username) return `${name} (@${from.username})`;
  return name || (from.username ? `@${from.username}` : `Telegram user ${from.id}`);
}

// Telegram retries on non-2xx responses, so anything past authentication
// is answered with 200 and reported to the user through the callback.
const ok = () => Response.json({ ok: true });

export async function POST(request: Request) {
  if (!process.env.TELEGRAM_WEBHOOK_SECRET) {
    console.error("[telegram] webhook rejected: TELEGRAM_WEBHOOK_SECRET is not set");
    return new Response("Webhook not configured", { status: 503 });
  }

  if (!isAuthentic(request)) {
    return new Response("Unauthorized", { status: 401 });
  }

  const update = (await request.json().catch(() => null)) as {
    callback_query?: CallbackQuery;
  } | null;
  const query = update?.callback_query;

  if (!query) {
    return ok();
  }

  const adminId = process.env.TELEGRAM_ADMIN_ID;
  if (!adminId || String(query.from.id) !== adminId.trim()) {
    await answerCallbackQuery(query.id, "Only admin can do this", true);
    return ok();
  }

  const action = decodeStatusAction(query.data);
  if (!action) {
    await answerCallbackQuery(query.id, "Unknown action", true);
    return ok();
  }

  try {
    const order = await changeOrderStatus(action.orderId, action.to, {
      expectedStatus: action.from,
    });

    await syncOrderMessage(order.id, { actor: displayName(query.from), at: new Date() });
    await answerCallbackQuery(query.id, `${order.orderCode}: ${statusLabel(order.status)}`);

    revalidatePath("/admin");
    revalidatePath("/menu");
    revalidatePath("/");
  } catch (error) {
    if (error instanceof ActionError) {
      // Usually a stale button (order already changed elsewhere) or not
      // enough stock. Show why, and refresh the message to the real state.
      await answerCallbackQuery(query.id, error.message, true);
      await syncOrderMessage(action.orderId);
    } else {
      console.error("[telegram] webhook status change failed:", error);
      await answerCallbackQuery(query.id, "Something went wrong. Try the admin panel.", true);
    }
  }

  return ok();
}
