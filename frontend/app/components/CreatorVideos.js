"use client";

import { useEffect, useRef, useState } from "react";
import { CloseIcon } from "./icons";

const iconProps = {
  width: 18,
  height: 18,
  viewBox: "0 0 24 24",
  fill: "none",
  stroke: "currentColor",
  strokeWidth: 2,
  strokeLinecap: "round",
  strokeLinejoin: "round",
  "aria-hidden": true,
};

function SoundIcon({ on }) {
  return (
    <svg {...iconProps}>
      <path d="M4 9v6h4l5 4V5L8 9H4Z" fill="currentColor" />
      {on ? <path d="M16.5 8.5a5 5 0 0 1 0 7M19 6a8.5 8.5 0 0 1 0 12" /> : <path d="m17 9 5 5m0-5-5 5" />}
    </svg>
  );
}

function prefersReducedMotion() {
  return window.matchMedia("(prefers-reduced-motion: reduce)").matches;
}

function InstagramMark() {
  return (
    <svg {...iconProps} width={16} height={16} className="shrink-0">
      <rect x="3.5" y="3.5" width="17" height="17" rx="5" />
      <circle cx="12" cy="12" r="4" />
      <circle cx="17.2" cy="6.8" r="0.9" fill="currentColor" stroke="none" />
    </svg>
  );
}

// Only the Instagram @handle is shown. It links to the collab reel, which
// opens in the Instagram app on phones.
function Credit({ video, className = "" }) {
  if (!video.handle) return null;

  const content = (
    <>
      <InstagramMark />
      <span className="truncate">@{video.handle}</span>
    </>
  );
  const classes = `flex min-w-0 max-w-full items-center gap-1.5 text-sm font-semibold ${className}`;

  return video.instagramUrl ? (
    <a
      href={video.instagramUrl}
      target="_blank"
      rel="noopener"
      aria-label={`@${video.handle} on Instagram`}
      className={`${classes} hover:underline`}
    >
      {content}
    </a>
  ) : (
    <p className={classes}>{content}</p>
  );
}

export default function CreatorVideos({ videos }) {
  const rowRefs = useRef([]);
  const [activeIndex, setActiveIndex] = useState(-1); // the one card playing in the row
  const [soundIndex, setSoundIndex] = useState(-1); // the card unmuted in the row
  const [viewerIndex, setViewerIndex] = useState(null);

  // Row: play the most visible card once it is at least 60% on screen, and
  // only that one. Nothing autoplays for visitors who prefer reduced motion.
  useEffect(() => {
    if (prefersReducedMotion() || !("IntersectionObserver" in window)) return;

    const ratios = new Map();
    const observer = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          ratios.set(Number(entry.target.dataset.index), entry.intersectionRatio);
        }

        let best = -1;
        let bestRatio = 0.6;
        for (const [index, ratio] of ratios) {
          if (ratio >= bestRatio) {
            best = index;
            bestRatio = ratio;
          }
        }
        setActiveIndex(best);
      },
      { threshold: [0, 0.3, 0.6, 0.9] }
    );

    rowRefs.current.forEach((video) => video && observer.observe(video));
    return () => observer.disconnect();
  }, [videos.length]);

  // Apply play/pause/mute to the row. Everything pauses while the viewer is open.
  useEffect(() => {
    rowRefs.current.forEach((video, index) => {
      if (!video) return;

      const shouldPlay = viewerIndex === null && index === activeIndex;
      video.muted = !(shouldPlay && index === soundIndex);

      if (shouldPlay) {
        video.play().catch(() => {});
      } else {
        video.pause();
      }
    });
  }, [activeIndex, soundIndex, viewerIndex]);

  return (
    <>
      <ul className="-mx-4 mt-5 flex snap-x snap-mandatory scroll-px-4 gap-3 overflow-x-auto px-4 pb-2 [scrollbar-width:none] sm:mt-8 sm:gap-4 lg:mx-0 lg:px-0 [&::-webkit-scrollbar]:hidden">
        {videos.map((video, index) => (
          <li key={video.id} className="w-[72%] shrink-0 snap-start sm:w-[38%] lg:w-[calc(25%-0.75rem)]">
            <div className="relative aspect-[9/16] overflow-hidden rounded-2xl bg-espresso shadow-soft">
              <video
                ref={(node) => {
                  rowRefs.current[index] = node;
                }}
                data-index={index}
                src={video.videoUrl}
                poster={video.posterUrl ?? undefined}
                preload="none"
                muted
                loop
                playsInline
                className="h-full w-full object-cover"
              />

              <button
                type="button"
                onClick={() => setViewerIndex(index)}
                className="absolute inset-0"
                aria-label={`Watch ${video.handle ? `@${video.handle}'s video` : "this video"} full screen with sound`}
              />

              <button
                type="button"
                onClick={() => {
                  setActiveIndex(index);
                  setSoundIndex((current) => (current === index ? -1 : index));
                }}
                className="absolute right-2 top-2 flex h-9 w-9 items-center justify-center rounded-full bg-black/55 text-white backdrop-blur-sm"
                aria-label={soundIndex === index ? "Mute" : "Play with sound"}
                aria-pressed={soundIndex === index}
              >
                <SoundIcon on={soundIndex === index} />
              </button>
            </div>

            <Credit video={video} className="mt-2 inline-flex text-fg" />
          </li>
        ))}
      </ul>

      {viewerIndex !== null && (
        <Viewer videos={videos} startIndex={viewerIndex} onClose={() => setViewerIndex(null)} />
      )}
    </>
  );
}

// Full screen: one video per screen with sound. Swipe up or down for the next.
function Viewer({ videos, startIndex, onClose }) {
  const scrollerRef = useRef(null);
  const videoRefs = useRef([]);
  const closeRef = useRef(null);
  const [current, setCurrent] = useState(startIndex);
  const [muted, setMuted] = useState(false);
  // Kept in a ref so the setup effect below runs once per open, not every
  // time the parent re-renders with a new callback.
  const onCloseRef = useRef(onClose);
  useEffect(() => {
    onCloseRef.current = onClose;
  }, [onClose]);

  useEffect(() => {
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    closeRef.current?.focus();
    scrollerRef.current?.children[startIndex]?.scrollIntoView();

    const onKeyDown = (event) => {
      if (event.key === "Escape") onCloseRef.current();
    };
    window.addEventListener("keydown", onKeyDown);

    const observer = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          if (entry.isIntersecting) setCurrent(Number(entry.target.dataset.index));
        }
      },
      { root: scrollerRef.current, threshold: 0.6 }
    );
    videoRefs.current.forEach((video) => video && observer.observe(video));

    return () => {
      document.body.style.overflow = previousOverflow;
      window.removeEventListener("keydown", onKeyDown);
      observer.disconnect();
    };
  }, [startIndex]);

  // Opening the viewer is a tap, so playing with sound is allowed.
  useEffect(() => {
    videoRefs.current.forEach((video, index) => {
      if (!video) return;

      if (index === current) {
        video.muted = muted;
        video.play().catch(() => {});
      } else {
        video.pause();
      }
    });
  }, [current, muted]);

  return (
    <div role="dialog" aria-modal="true" aria-label="Creator videos" className="fixed inset-0 z-[60] bg-black text-white">
      <div
        ref={scrollerRef}
        className="h-full snap-y snap-mandatory overflow-y-auto overscroll-contain [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
      >
        {videos.map((video, index) => (
          <div key={video.id} className="relative flex h-full snap-start snap-always items-center justify-center">
            <video
              ref={(node) => {
                videoRefs.current[index] = node;
              }}
              data-index={index}
              src={video.videoUrl}
              poster={video.posterUrl ?? undefined}
              preload={index === startIndex ? "auto" : "none"}
              loop
              playsInline
              onClick={(event) => (event.currentTarget.paused ? event.currentTarget.play() : event.currentTarget.pause())}
              className="h-full max-h-full w-full max-w-[min(100%,calc(100dvh*9/16))] object-contain"
            />
            <div className="pointer-events-none absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/80 to-transparent px-4 pb-[max(1.25rem,env(safe-area-inset-bottom))] pt-16">
              <div className="mx-auto max-w-md">
                <Credit video={video} className="pointer-events-auto inline-flex" />
              </div>
            </div>
          </div>
        ))}
      </div>

      <div className="absolute right-3 top-[max(0.75rem,env(safe-area-inset-top))] flex gap-2">
        <button
          type="button"
          onClick={() => setMuted((value) => !value)}
          className="flex h-11 w-11 items-center justify-center rounded-full bg-white/15 backdrop-blur-sm"
          aria-label={muted ? "Turn sound on" : "Mute"}
        >
          <SoundIcon on={!muted} />
        </button>
        <button
          ref={closeRef}
          type="button"
          onClick={onClose}
          className="flex h-11 w-11 items-center justify-center rounded-full bg-white/15 backdrop-blur-sm"
          aria-label="Close videos"
        >
          <CloseIcon />
        </button>
      </div>
    </div>
  );
}
