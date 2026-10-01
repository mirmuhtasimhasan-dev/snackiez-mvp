export const ORDER_CODE_PREFIX = "BZ-";

export function generateOrderCode() {
  return ORDER_CODE_PREFIX + Math.floor(100000 + Math.random() * 900000);
}

// Bangladeshi mobile number, e.g. 01712345678 (operators 013 to 019)
export const BD_PHONE_PATTERN = /^01[3-9]\d{8}$/;

// Accepts "+880 1712-345678", "8801712345678" or "01712345678" and returns
// the local 11-digit form.
export function normalizeBdPhone(value: string) {
  const digits = value.replace(/\D/g, "");
  return digits.startsWith("880") ? digits.slice(2) : digits;
}

export const BKASH_TRX_ID_PATTERN = /^[A-Z0-9]{6,20}$/;

/**
 * The merchant bKash number from BKASH_NUMBER, or null when it is unset or
 * not a valid Bangladeshi mobile number (e.g. a leftover placeholder). bKash
 * checkout is turned off when this is null. Server-side only.
 */
export function getBkashNumber() {
  const number = normalizeBdPhone(process.env.BKASH_NUMBER ?? "");
  return BD_PHONE_PATTERN.test(number) ? number : null;
}
