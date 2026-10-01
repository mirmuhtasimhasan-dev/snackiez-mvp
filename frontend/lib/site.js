export const WHATSAPP_NUMBER = "01816453795";
export const FACEBOOK_URL = "https://facebook.com/bitezzbd";
export const HOURS = "Open till 4 AM";
export const AREA = "Bashundhara R/A, Dhaka";
export const DELIVERY_ZONES = ["Bashundhara R/A", "NSU", "IUB", "NISS"];

export function whatsappLink(message) {
  const url = `https://wa.me/88${WHATSAPP_NUMBER}`;
  return message ? `${url}?text=${encodeURIComponent(message)}` : url;
}

export function formatPrice(amount) {
  return `TK ${Number(amount).toLocaleString("en-US")}`;
}

// Compact price for menu cards, e.g. "৳249". Never breaks across lines.
export function formatPriceShort(amount) {
  return `৳${Number(amount).toLocaleString("en-US")}`;
}
