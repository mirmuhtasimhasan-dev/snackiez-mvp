import { connection } from "next/server";
import CheckoutForm from "./CheckoutForm";

export const metadata = {
  title: "Checkout",
};

export default async function CheckoutPage() {
  // Read BKASH_NUMBER per request so changing it doesn't need a rebuild.
  await connection();
  const bkashNumber = process.env.BKASH_NUMBER || null;

  return (
    <main className="mx-auto max-w-5xl px-4 pb-16 pt-8">
      <h1 className="font-display text-5xl tracking-wide sm:text-6xl">Checkout</h1>
      <p className="mt-1 text-muted">We deliver inside Bashundhara R/A only.</p>

      <CheckoutForm bkashNumber={bkashNumber} />
    </main>
  );
}
