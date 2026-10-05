import Link from "next/link";
import { connection } from "next/server";
import { getPublicReviews } from "@/lib/site-data";
import ReviewCard, { ReviewStars, reviewSummary } from "@/app/components/ReviewCard";

export const metadata = {
  title: "Reviews",
  description: "What customers in Bashundhara R/A say about Bitezz.",
};

export default async function ReviewsPage() {
  await connection();

  const reviews = await getPublicReviews();
  const summary = reviewSummary(reviews);

  return (
    <main className="mx-auto max-w-6xl px-4 pb-16 pt-8">
      <h1 className="font-display text-5xl tracking-wide sm:text-6xl">Reviews</h1>

      {summary ? (
        <>
          <p className="mt-2 flex flex-wrap items-center gap-2 text-muted">
            <ReviewStars rating={Math.round(Number(summary.average))} className="text-xl" />
            <span>
              <span className="font-semibold text-fg">{summary.average}</span> from {summary.count}{" "}
              {summary.count === 1 ? "review" : "reviews"}
            </span>
          </p>

          <ul className="mt-8 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {reviews.map((review) => (
              <li key={review.id}>
                <ReviewCard review={review} />
              </li>
            ))}
          </ul>
        </>
      ) : (
        <p className="mt-8 rounded-2xl border border-line bg-card p-8 text-center text-muted">
          There are no reviews yet.
        </p>
      )}

      <Link
        href="/menu"
        className="mt-10 inline-flex h-12 items-center rounded-full bg-brand px-8 font-semibold text-fg hover:bg-brand-hover"
      >
        See the menu
      </Link>
    </main>
  );
}
