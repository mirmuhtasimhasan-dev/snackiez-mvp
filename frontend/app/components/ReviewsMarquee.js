"use client";

import { useEffect, useRef, useState } from "react";
import ReviewCard, { ReviewLabel, ReviewStars } from "./ReviewCard";
import { CloseIcon } from "./icons";

// A row needs enough cards to be wider than the screen, or the loop shows a gap.
const MIN_CARDS_PER_ROW = 8;

function fill(reviews) {
  if (reviews.length === 0) return [];

  const repeats = Math.ceil(MIN_CARDS_PER_ROW / reviews.length);
  return Array.from({ length: repeats }, () => reviews).flat();
}

// One endless row. The track holds the cards twice and slides by exactly half
// its width (CSS only, see .marquee-track in globals.css), so the loop has no
// seam. Only the first copy of each review is real; the rest are hidden from
// assistive tech and removed entirely for reduced-motion visitors, who get a
// normal horizontal scroll row instead.
function Row({ reviews, direction, onOpen }) {
  const [paused, setPaused] = useState(false);
  const cards = fill(reviews);

  if (cards.length === 0) return null;

  return (
    <div
      className="marquee"
      onTouchStart={() => setPaused(true)}
      onTouchEnd={() => setPaused(false)}
      onTouchCancel={() => setPaused(false)}
    >
      <ul
        className={`marquee-track ${direction === "right" ? "marquee-right" : "marquee-left"}`}
        style={paused ? { animationPlayState: "paused" } : undefined}
      >
        {[0, 1].flatMap((half) =>
          cards.map((review, index) => {
            const original = half === 0 && index < reviews.length;

            return (
              <li
                key={`${half}-${index}`}
                aria-hidden={original ? undefined : true}
                className={`w-[260px] shrink-0 sm:w-[300px] ${original ? "" : "marquee-copy"}`}
              >
                <button
                  type="button"
                  tabIndex={original ? 0 : -1}
                  onClick={() => onOpen(review)}
                  aria-label={`Read the full review from ${review.name}`}
                  className="block h-full w-full rounded-2xl text-left"
                >
                  <ReviewCard review={review} clamp />
                </button>
              </li>
            );
          })
        )}
      </ul>
    </div>
  );
}

export default function ReviewsMarquee({ reviews }) {
  const [openReview, setOpenReview] = useState(null);
  const closeRef = useRef(null);

  // In sortOrder sequence: 1st, 3rd, 5th... on top, 2nd, 4th, 6th... below.
  const top = reviews.filter((_, index) => index % 2 === 0);
  const bottom = reviews.filter((_, index) => index % 2 === 1);

  useEffect(() => {
    if (!openReview) return;

    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    closeRef.current?.focus();

    const onKeyDown = (event) => {
      if (event.key === "Escape") setOpenReview(null);
    };
    window.addEventListener("keydown", onKeyDown);

    return () => {
      document.body.style.overflow = previousOverflow;
      window.removeEventListener("keydown", onKeyDown);
    };
  }, [openReview]);

  return (
    <>
      <div className="space-y-3 sm:space-y-4">
        <Row reviews={top} direction="left" onOpen={setOpenReview} />
        <Row reviews={bottom} direction="right" onOpen={setOpenReview} />
      </div>

      {openReview && (
        <div className="fixed inset-0 z-[60] flex items-end justify-center p-4 sm:items-center">
          <div className="absolute inset-0 bg-black/60" onClick={() => setOpenReview(null)} aria-hidden="true" />
          <div
            role="dialog"
            aria-modal="true"
            aria-label={`Review from ${openReview.name}`}
            className="relative max-h-[85dvh] w-full max-w-md overflow-y-auto rounded-3xl bg-card p-5 shadow-2xl sm:p-6"
          >
            <button
              ref={closeRef}
              type="button"
              onClick={() => setOpenReview(null)}
              className="absolute right-3 top-3 flex h-10 w-10 items-center justify-center rounded-full text-fg/80 hover:bg-alt"
              aria-label="Close review"
            >
              <CloseIcon />
            </button>

            <ReviewStars rating={openReview.rating} className="text-2xl" />
            <p className="mt-4 whitespace-pre-line text-fg/90">“{openReview.text}”</p>

            {openReview.image && (
              // eslint-disable-next-line @next/next/no-img-element -- any host
              <img src={openReview.image} alt="" className="mt-4 max-h-72 w-full rounded-2xl object-cover" />
            )}

            <div className="mt-5">
              <p className="font-semibold text-fg">{openReview.name}</p>
              <ReviewLabel review={openReview} />
            </div>
          </div>
        </div>
      )}
    </>
  );
}
