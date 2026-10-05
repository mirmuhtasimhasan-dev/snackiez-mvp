import ReviewForm from "./ReviewForm";

export const metadata = {
  title: "Rate your order",
  robots: { index: false, follow: false },
};

export default async function ReviewPage({ params }) {
  const { orderCode } = await params;
  const code = decodeURIComponent(orderCode).trim().toUpperCase();
  // Customers are not signed in, so photos are stored by the server with the
  // service role key. Without it the photo field is hidden.
  const photoEnabled = Boolean(process.env.SUPABASE_SERVICE_ROLE_KEY);

  return (
    <main className="mx-auto max-w-md px-4 py-10">
      <h1 className="font-display text-5xl tracking-wide">Rate your order</h1>
      <p className="mt-2 text-muted">
        Thank you for ordering from Bitezz. We would be grateful for your feedback on order{" "}
        <span className="font-semibold text-fg">{code}</span>.
      </p>

      <ReviewForm orderCode={code} photoEnabled={photoEnabled} />
    </main>
  );
}
