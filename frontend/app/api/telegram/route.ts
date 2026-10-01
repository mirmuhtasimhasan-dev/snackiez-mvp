import { timingSafeEqual } from "node:crypto";
import { revalidatePath, revalidateTag } from "next/cache";
import { ActionError } from "@/lib/action-result";
import { changeOrderStatus } from "@/lib/order-status";
import { decodeStatusAction, statusLabel, syncOrderMessage } from "@/lib/order-telegram";
import { SETTINGS_TAG } from "@/lib/settings";
import { parseStoreCommand, runStoreCommand } from "@/lib/store-telegram";
import { answerCallbackQuery, sendMessage } from "@/lib/telegram";

// Telegram calls this for button presses on order messages and for the
// /open, /close and /status commands. Register it with setWebhook, passing
// TELEGRAM_WEBHOOK_SECRET as secret_token and allowing both "callback_query"
// and "message" updates (the command is in .env.example).

type CallbackQuery = {
  id: string;
  data?: string;
  from: { id: number; first_name?: string; last_name?: string; username?: string };
};

type Message = {
  text?: string;
  chat: { id: number };
  from?: { id: number };
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
    message?: Message;
  } | null;
  const adminId = process.env.TELEGRAM_ADMIN_ID;

  if (update?.message) {
    await handleStoreCommand(update.message, adminId);
    return ok();
  }

  const query = update?.callback_query;

  if (!query) {
    return ok();
  }

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

// /open, /close and /status. Only answered in the orders group or the
// admin's own chat, and only the admin may use them.
async function handleStoreCommand(message: Message, adminId: string | undefined) {
  const command = parseStoreCommand(message.text);
  if (!command) return;

  const chatId = String(message.chat.id);
  const allowedChats = [process.env.TELEGRAM_CHAT_ID?.trim(), adminId?.trim()].filter(Boolean);
  if (!allowedChats.includes(chatId)) return;

  if (!adminId || String(message.from?.id) !== adminId.trim()) {
    await sendMessage("Only admin can do this", { chatId });
    return;
  }

  try {
    const { changed, reply } = await runStoreCommand(command);

    if (changed) {
      // A webhook cannot use updateTag, so expire the cached settings now:
      // the next page view must show the new open/closed state.
      revalidateTag(SETTINGS_TAG, { expire: 0 });
      revalidatePath("/", "layout");
    }

    await sendMessage(reply, { chatId });
  } catch (error) {
    console.error("[telegram] store command failed:", error);
    await sendMessage("Something went wrong. Try the admin panel.", { chatId });
  }
}
