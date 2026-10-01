// Contact details, hours and the delivery fee come from SiteSettings (admin
// Settings page). Only things that never change live here.
export const AREA = "Bashundhara R/A, Dhaka";
export const DELIVERY_ZONES = ["Bashundhara R/A", "NSU", "IUB", "NISS"];

/** wa.me link for a local BD number like 01816453795, or null without one. */
export function whatsappLink(number, message) {
  if (!number) return null;

  const url = `https://wa.me/88${number}`;
  return message ? `${url}?text=${encodeURIComponent(message)}` : url;
}

/** tel: link for a local BD number, or null without one. */
export function telLink(number) {
  return number ? `tel:+88${number}` : null;
}

export function formatPrice(amount) {
  return `TK ${Number(amount).toLocaleString("en-US")}`;
}

// Compact price for menu cards, e.g. "৳249". Never breaks across lines.
export function formatPriceShort(amount) {
  return `৳${Number(amount).toLocaleString("en-US")}`;
}
