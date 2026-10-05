// Shared by the home marquee and the /reviews page.

export function ReviewStars({ rating, className = "" }) {
  return (
    <p className={`leading-none text-highlight-ink ${className}`} aria-label={`${rating} out of 5 stars`}>
      {"★".repeat(rating)}
      <span className="text-line">{"★".repeat(5 - rating)}</span>
    </p>
  );
}

// Where the review came from: "Verified order" for customers who ordered on
// the site, otherwise the source set in admin (WhatsApp, Facebook, Google).
export function ReviewLabel({ review }) {
  if (review.isVerified) {
    return (
      <span className="inline-block rounded-full bg-green-100 px-2 py-0.5 text-[11px] font-semibold text-green-800">
        Verified order
      </span>
    );
  }

  return review.source ? <span className="text-xs text-muted">via {review.source}</span> : null;
}

/** `clamp` limits the text to four lines (marquee); the grid shows it in full. */
export default function ReviewCard({ review, clamp = false }) {
  return (
    <div className="flex h-full flex-col rounded-2xl border border-line bg-card p-4 text-left shadow-soft sm:p-5">
      <ReviewStars rating={review.rating} className="text-lg" />
      <p className={`mt-3 flex-1 text-sm text-fg/90 ${clamp ? "line-clamp-4" : ""}`}>“{review.text}”</p>
      <div className="mt-4 flex items-center gap-3">
        {review.image && (
          // Uploaded to Supabase Storage or pasted in admin: any host, so a plain img.
          // eslint-disable-next-line @next/next/no-img-element
          <img src={review.image} alt="" loading="lazy" className="h-10 w-10 shrink-0 rounded-lg object-cover" />
        )}
        <div className="min-w-0">
          <p className="truncate text-sm font-semibold text-fg">{review.name}</p>
          <ReviewLabel review={review} />
        </div>
      </div>
    </div>
  );
}

export function reviewSummary(reviews) {
  if (reviews.length === 0) return null;

  const average = reviews.reduce((sum, review) => sum + review.rating, 0) / reviews.length;
  return { average: average.toFixed(1), count: reviews.length };
}
