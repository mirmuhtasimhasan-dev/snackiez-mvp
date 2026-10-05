// Review links and the message sent to customers. Safe to import anywhere.

export function reviewPath(orderCode: string) {
  return `/review/${encodeURIComponent(orderCode)}`;
}

export function firstName(fullName: string) {
  return fullName.trim().split(/\s+/)[0] || "Customer";
}

/**
 * How a customer review is signed: first name plus area, e.g. "Tanvir, Block D".
 * The area comes from the "Block X" part of the delivery address.
 */
export function reviewerName(customer: { name: string; address?: string | null }) {
  const block = customer.address?.match(/\bBlock\s+([^,]+)/i)?.[1]?.trim();
  return `${firstName(customer.name)}, ${block ? `Block ${block}` : "Bashundhara"}`;
}

/** The WhatsApp message for "Send review link". Wording is fixed by the owner. */
export function reviewRequestMessage(customerName: string, orderCode: string, reviewLink: string) {
  return `Hello ${firstName(customerName)},

Thank you for ordering from Bitezz. We hope you enjoyed your meal.

We would be grateful if you could take a moment to rate your order ${orderCode}. Your feedback helps us serve you better.

Leave your review here:
${reviewLink}

Warm regards,
Team Bitezz`;
}

/** Public https base URL of the site, or null when it is not configured (server only). */
export function siteBaseUrl() {
  const base =
    process.env.SITE_URL ||
    (process.env.VERCEL_PROJECT_PRODUCTION_URL
      ? `https://${process.env.VERCEL_PROJECT_PRODUCTION_URL}`
      : "");

  return base.startsWith("https://") ? base.replace(/\/$/, "") : null;
}
