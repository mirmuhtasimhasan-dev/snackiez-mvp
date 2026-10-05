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

function SoundIcon({ on, size = 18 }) {
  return (
    <svg {...iconProps} width={size} height={size}>
      <path d="M4 9v6h4l5 4V5L8 9H4Z" fill="currentColor" />
      {on ? <path d="M16.5 8.5a5 5 0 0 1 0 7M19 6a8.5 8.5 0 0 1 0 12" /> : <path d="m17 9 5 5m0-5-5 5" />}
    </svg>
  );
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

function ArrowIcon({ direction }) {
  return (
    <svg {...iconProps} width={20} height={20}>
      <path d={direction === "left" ? "m15 5-7 7 7 7" : "m9 5 7 7-7 7"} />
    </svg>
  );
}

function videoLabel(video) {
  return video.handle ? `the video from @${video.handle}` : "this video";
}

// Shortest way round the loop from the active card: -2, -1, 0, 1, 2 ...
function offsetOf(index, active, count) {
  const half = Math.floor(count / 2);
  return ((((index - active + half) % count) + count) % count) - half;
}

// Centre-focus carousel. The middle card is full size and is the only one
// with a <video>; the others show their poster, smaller and dimmed. It loops
// forever and moves on when the active video ends.
export default function CreatorVideos({ videos }) {
  const count = videos.length;
  const rootRef = useRef(null);
  const videoRef = useRef(null);
  const progressRef = useRef(null);
  const heldRef = useRef(false); // hovering or touching: do not auto advance
  const touchStartX = useRef(null);

  // `jumped` lists cards that wrapped from one end to the other on the last
  // move; they skip the slide animation so they do not fly across the row.
  const [state, setState] = useState({ active: 0, jumped: [] });
  const [inView, setInView] = useState(false);
  const [soundOn, setSoundOn] = useState(false);
  const [reducedMotion, setReducedMotion] = useState(false);
  const [viewerIndex, setViewerIndex] = useState(null);
  const { active, jumped } = state;

  const goTo = (target) => {
    setState((current) => {
      const next = ((target % count) + count) % count;
      if (next === current.active) return current;

      const wrapped = videos
        .filter(
          (_, index) =>
            Math.abs(offsetOf(index, next, count) - offsetOf(index, current.active, count)) > 1
        )
        .map((video) => video.id);
      return { active: next, jumped: wrapped };
    });
  };

  useEffect(() => {
    const media = window.matchMedia("(prefers-reduced-motion: reduce)");
    const update = () => setReducedMotion(media.matches);
    update();
    media.addEventListener("change", update);

    const observer = new IntersectionObserver(([entry]) => setInView(entry.isIntersecting), {
      threshold: 0.4,
    });
    if (rootRef.current) observer.observe(rootRef.current);

    return () => {
      media.removeEventListener("change", update);
      observer.disconnect();
    };
  }, []);

  // Play the active video only while the carousel is on screen, the full
  // screen viewer is closed, and motion is allowed.
  const shouldPlay = inView && viewerIndex === null && !reducedMotion;
  useEffect(() => {
    const video = videoRef.current;
    if (!video) return;

    video.muted = !soundOn;
    if (shouldPlay) {
      video.play().catch(() => {});
    } else {
      video.pause();
    }
  }, [shouldPlay, soundOn, active]);

  // Progress bar: back to 0 whenever a new video becomes active.
  useEffect(() => {
    if (progressRef.current) progressRef.current.style.width = "0%";
  }, [active]);

  // While playing, follow the video's real position every frame.
  useEffect(() => {
    if (!shouldPlay) return;

    let frame;
    const tick = () => {
      const video = videoRef.current;
      if (video && progressRef.current && video.duration > 0 && !video.ended) {
        progressRef.current.style.width = `${Math.min(100, (video.currentTime / video.duration) * 100)}%`;
      }
      frame = requestAnimationFrame(tick);
    };
    frame = requestAnimationFrame(tick);

    return () => cancelAnimationFrame(frame);
  }, [shouldPlay, active]);

  const handleEnded = () => {
    const video = videoRef.current;
    if (progressRef.current) progressRef.current.style.width = "100%";
    // Held (hover or touch) or a single video: replay in place.
    if (heldRef.current || count < 2) {
      if (video) {
        video.currentTime = 0;
        video.play().catch(() => {});
      }
      return;
    }
    goTo(active + 1);
  };

  const handleTouchEnd = (event) => {
    heldRef.current = false;
    if (touchStartX.current === null) return;

    const delta = event.changedTouches[0].clientX - touchStartX.current;
    touchStartX.current = null;
    if (Math.abs(delta) > 40) goTo(active + (delta < 0 ? 1 : -1));
  };

  return (
    <div ref={rootRef} className="mt-8">
      <div
        role="group"
        aria-roledescription="carousel"
        aria-label="Creator videos"
        className="relative [--w:min(62vw,250px)] sm:[--w:250px] lg:[--w:270px]"
        onMouseEnter={() => {
          heldRef.current = true;
        }}
        onMouseLeave={() => {
          heldRef.current = false;
        }}
        onTouchStart={(event) => {
          heldRef.current = true;
          touchStartX.current = event.touches[0].clientX;
        }}
        onTouchEnd={handleTouchEnd}
        onTouchCancel={() => {
          heldRef.current = false;
          touchStartX.current = null;
        }}
      >
        <div className="relative h-[calc(var(--w)*16/9)] overflow-hidden">
          {videos.map((video, index) => {
            const offset = offsetOf(index, active, count);
            const distance = Math.abs(offset);
            const isActive = offset === 0;
            // Up to two cards each side on wide screens; further ones wait hidden.
            const hidden = distance > 2 || (distance === 2 && count < 5);

            return (
              <div
                key={video.id}
                aria-hidden={!isActive}
                className={`absolute left-1/2 top-0 -ml-[calc(var(--w)/2)] w-[var(--w)] duration-500 ease-out ${
                  jumped.includes(video.id) ? "transition-none" : "transition-[transform,opacity,filter]"
                } ${hidden ? "pointer-events-none opacity-0" : "opacity-100"} ${
                  isActive ? "z-20" : distance === 1 ? "z-10 brightness-50" : "z-0 brightness-[0.35]"
                }`}
                style={{
                  transform: `translateX(calc(${offset} * var(--w) * 0.9)) scale(${
                    isActive ? 1 : distance === 1 ? 0.85 : 0.72
                  })`,
                }}
              >
                <div className="relative aspect-[9/16] overflow-hidden rounded-3xl bg-black shadow-2xl shadow-black/60 ring-1 ring-white/10">
                  {video.posterUrl && (
                    // eslint-disable-next-line @next/next/no-img-element -- local poster from public/videos
                    <img
                      src={video.posterUrl}
                      alt=""
                      loading="lazy"
                      className="absolute inset-0 h-full w-full object-cover"
                    />
                  )}

                  {isActive ? (
                    <>
                      {/* The only <video> in the row: nothing else loads. */}
                      <video
                        ref={videoRef}
                        key={video.id}
                        src={video.videoUrl}
                        poster={video.posterUrl ?? undefined}
                        preload={shouldPlay ? "auto" : "none"}
                        muted
                        playsInline
                        onEnded={handleEnded}
                        className="absolute inset-0 h-full w-full object-cover"
                      />

                      <button
                        type="button"
                        onClick={() => setViewerIndex(index)}
                        className="absolute inset-0"
                        aria-label={`Watch ${videoLabel(video)} full screen with sound`}
                      />

                      <button
                        type="button"
                        onClick={() => setSoundOn((value) => !value)}
                        className="absolute right-3 top-3 flex h-8 w-8 items-center justify-center rounded-full bg-black/50 text-white backdrop-blur-sm"
                        aria-label={soundOn ? "Mute" : "Turn sound on"}
                        aria-pressed={soundOn}
                      >
                        <SoundIcon on={soundOn} size={16} />
                      </button>

                      {/* Bottom 35%: dark gradient so the bar and @handle stay
                          readable over text baked into the video. */}
                      <div className="pointer-events-none absolute inset-x-0 bottom-0 flex h-[35%] flex-col justify-end bg-gradient-to-t from-black/75 to-transparent px-3 pb-3 text-white">
                        {/* Progress bar: width follows the video (see the effect above). */}
                        <div className="h-[3px] w-full overflow-hidden rounded-full bg-white/25">
                          <div ref={progressRef} className="h-full w-0 rounded-full bg-white/90" />
                        </div>
                        <div className="mt-2.5">
                          <Credit video={video} className="pointer-events-auto inline-flex" />
                        </div>
                      </div>
                    </>
                  ) : (
                    <button
                      type="button"
                      tabIndex={-1}
                      onClick={() => goTo(index)}
                      className="absolute inset-0"
                      aria-label={`Show ${videoLabel(video)}`}
                    />
                  )}
                </div>
              </div>
            );
          })}
        </div>

        {count > 1 && (
          <>
            <button
              type="button"
              onClick={() => goTo(active - 1)}
              className="absolute left-2 top-1/2 z-30 hidden h-11 w-11 -translate-y-1/2 items-center justify-center rounded-full bg-white/10 text-white ring-1 ring-white/20 backdrop-blur-sm transition hover:bg-brand hover:text-fg md:flex lg:left-6"
              aria-label="Previous video"
            >
              <ArrowIcon direction="left" />
            </button>
            <button
              type="button"
              onClick={() => goTo(active + 1)}
              className="absolute right-2 top-1/2 z-30 hidden h-11 w-11 -translate-y-1/2 items-center justify-center rounded-full bg-white/10 text-white ring-1 ring-white/20 backdrop-blur-sm transition hover:bg-brand hover:text-fg md:flex lg:right-6"
              aria-label="Next video"
            >
              <ArrowIcon direction="right" />
            </button>
          </>
        )}
      </div>

      {count > 1 && (
        <div className="mt-5 flex justify-center gap-2 md:hidden">
          {videos.map((video, index) => (
            <button
              key={video.id}
              type="button"
              onClick={() => goTo(index)}
              aria-label={`Video ${index + 1} of ${count}`}
              aria-current={index === active ? "true" : undefined}
              className={`h-2 rounded-full transition-all ${index === active ? "w-6 bg-brand" : "w-2 bg-white/30"}`}
            />
          ))}
        </div>
      )}

      {viewerIndex !== null && (
        <Viewer videos={videos} startIndex={viewerIndex} onClose={() => setViewerIndex(null)} />
      )}
    </div>
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
