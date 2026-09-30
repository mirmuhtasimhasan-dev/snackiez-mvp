// Minimal Telegram Bot API client. Every helper logs and swallows failures:
// Telegram being down or misconfigured must never break an order.

export type InlineButton = { text: string; callback_data: string } | { text: string; url: string };
export type InlineKeyboard = InlineButton[][];

type SendOptions = { replyMarkup?: InlineKeyboard };

const API_TIMEOUT_MS = 8000;

function config() {
  const token = process.env.TELEGRAM_BOT_TOKEN;
  const chatId = process.env.TELEGRAM_CHAT_ID;

  if (!token || !chatId) {
    return null;
  }

  return { token, chatId };
}

async function callApi<T>(method: string, body: Record<string, unknown>): Promise<T | null> {
  const settings = config();

  if (!settings) {
    console.warn(`[telegram] ${method} skipped: TELEGRAM_BOT_TOKEN or TELEGRAM_CHAT_ID is not set`);
    return null;
  }

  try {
    const response = await fetch(`https://api.telegram.org/bot${settings.token}/${method}`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
      signal: AbortSignal.timeout(API_TIMEOUT_MS),
      cache: "no-store",
    });
    const json = (await response.json().catch(() => null)) as
      | { ok: true; result: T }
      | { ok: false; description?: string }
      | null;

    if (!json?.ok) {
      console.error(
        `[telegram] ${method} failed (${response.status}):`,
        json && "description" in json ? json.description : "no response body"
      );
      return null;
    }

    return json.result;
  } catch (error) {
    console.error(`[telegram] ${method} error:`, error);
    return null;
  }
}

function markup(replyMarkup?: InlineKeyboard) {
  // An empty inline_keyboard removes the buttons when editing.
  return { inline_keyboard: replyMarkup ?? [] };
}

/** Sends an HTML message to the orders chat. Returns the message id, or null on failure. */
export async function sendMessage(text: string, options: SendOptions = {}) {
  const settings = config();
  const result = await callApi<{ message_id: number }>("sendMessage", {
    chat_id: settings?.chatId,
    text,
    parse_mode: "HTML",
    link_preview_options: { is_disabled: true },
    reply_markup: markup(options.replyMarkup),
  });

  return result?.message_id ?? null;
}

/** Replaces the text and buttons of a message in the orders chat. Returns true on success. */
export async function editMessage(messageId: number, text: string, options: SendOptions = {}) {
  const settings = config();
  const result = await callApi<unknown>("editMessageText", {
    chat_id: settings?.chatId,
    message_id: messageId,
    text,
    parse_mode: "HTML",
    link_preview_options: { is_disabled: true },
    reply_markup: markup(options.replyMarkup),
  });

  return result !== null;
}

/** Acknowledges a button press, optionally with a popup alert. */
export async function answerCallbackQuery(callbackQueryId: string, text?: string, showAlert = false) {
  await callApi("answerCallbackQuery", {
    callback_query_id: callbackQueryId,
    text,
    show_alert: showAlert,
  });
}

/** Escapes user-provided text for Telegram's HTML parse mode. */
export function escapeHtml(value: string) {
  return value.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
}
