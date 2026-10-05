import { getImageProps } from "next/image";
import Link from "next/link";
import { connection } from "next/server";
import heroDesktop from "@/public/hero-light.webp";
import heroMobile from "@/public/hero-light-mobile.webp";
import { getCreatorVideos, getMenu, getPublicReviews } from "@/lib/site-data";
import { categoryImage, categoryShortName } from "@/lib/categories";
import { getSiteSettings } from "@/lib/settings";
import { DELIVERY_ZONES, formatPrice, whatsappLink } from "@/lib/site";
import AddToCartButton from "@/app/components/AddToCartButton";
import CategoryCircle from "@/app/components/CategoryCircle";
import CreatorVideos from "@/app/components/CreatorVideos";
import FallbackImage from "@/app/components/FallbackImage";
import MenuCard from "@/app/components/MenuCard";
import Reveal from "@/app/components/Reveal";
import { ReviewStars, reviewSummary } from "@/app/components/ReviewCard";
import ReviewsMarquee from "@/app/components/ReviewsMarquee";
import {
  BagIcon,
  CashIcon,
  CheckIcon,
  ClockIcon,
  InstagramIcon,
  MoonIcon,
  PinIcon,
  WhatsAppIcon,
} from "@/app/components/icons";

export const metadata = {
  title: { absolute: "Bitezz | Late Night Food Delivery in Bashundhara R/A" },
};

const NEW_ITEM_NAME = "BBQ Micro Burger";
const NEW_ITEM_PRICE = 289;

// Hours, WhatsApp number and delivery fee come from admin Settings.
function buildInfo(settings) {
  return [
    { icon: MoonIcon, title: "Late Night Delivery", detail: "Cravings after midnight? We got you." },
    { icon: ClockIcon, title: settings.hoursText, detail: "Hot food, every night." },
    { icon: PinIcon, title: "Bashundhara R/A only", detail: "NSU, IUB and around" },
    { icon: CashIcon, title: "Cash on Delivery", detail: "Or pay with bKash" },
    settings.whatsappNumber && {
      icon: WhatsAppIcon,
      title: `WhatsApp ${settings.whatsappNumber}`,
      detail: "Questions? Message us",
      href: whatsappLink(settings.whatsappNumber),
    },
  ].filter(Boolean);
}

// "https://www.instagram.com/bitezzbd?x=1" -> { url without tracking, handle: "bitezzbd" }
function instagramProfile(url) {
  if (!url) return null;

  try {
    const { origin, pathname } = new URL(url);
    const handle = pathname.split("/").filter(Boolean)[0];
    return handle ? { url: `${origin}/${handle}`, handle } : null;
  } catch {
    return null;
  }
}

function feeLabel(fee) {
  return fee > 0 ? formatPrice(fee) : "Free";
}

const mobileChips = [
  { icon: MoonIcon, label: "Late Night" },
  { icon: PinIcon, label: "Bashundhara" },
  { icon: CashIcon, label: "COD / bKash" },
];

const reasons = [
  { icon: MoonIcon, title: "Late Night", text: "The kitchen stays open late for study nights and midnight cravings." },
  { icon: CheckIcon, title: "Fresh Made", text: "Every order is cooked when you place it. Nothing sits under a lamp." },
  { icon: BagIcon, title: "Fast Delivery", text: "We only deliver inside Bashundhara, so food reaches you hot." },
  { icon: CashIcon, title: "COD or bKash", text: "Pay cash at the door or send money with bKash. Your choice." },
];

const steps = [
  { title: "Pick your food", text: "Browse the menu and add what you crave to the cart." },
  { title: "Check out", text: "Enter your name, phone and Bashundhara address. Choose COD or bKash." },
  { title: "Eat it hot", text: "We cook it fresh and our rider brings it to your door." },
];

function buildFaqs(settings) {
  return [
    {
      q: "How long does delivery take?",
      a: "Usually within 30 minutes inside Bashundhara R/A. Late night rush can take a little longer.",
    },
    {
      q: "What is the delivery charge?",
      a:
        settings.deliveryFee > 0
          ? `A flat ${formatPrice(settings.deliveryFee)} on every order, shown at checkout before you place it.`
          : "Delivery is free right now.",
    },
    {
      q: "How can I pay?",
      a: "Cash on Delivery, or bKash Send Money. For bKash, send the total to our number and enter the Transaction ID at checkout. We verify it before cooking.",
    },
    {
      q: "Which areas do you deliver to?",
      a: "Bashundhara R/A only, including NSU, IUB and NISS. Enter your block, road and house at checkout.",
    },
  ];
}

function SectionHeading({ eyebrow, title, children }) {
  return (
    <div className="max-w-2xl">
      {eyebrow && (
        <p className="text-xs font-semibold uppercase tracking-[0.2em] text-highlight-ink sm:text-sm">{eyebrow}</p>
      )}
      <h2 className="mt-1 font-display text-4xl leading-none tracking-wide sm:text-6xl">{title}</h2>
      {children && <p className="mt-2 text-sm text-muted sm:mt-3 sm:text-base">{children}</p>}
    </div>
  );
}

// Art-directed hero: phones get the tighter crop in the page flow, desktops
// get the wide shot as a full-bleed background. <picture> means each device
// downloads only its own image. fetchPriority replaces preload here, since
// which image is the LCP depends on the viewport.
function HeroImage() {
  const common = {
    alt: "Chicken wraps, a crispy chicken burger, fries and fried chicken tenders",
    sizes: "100vw",
  };
  const {
    props: { srcSet: desktopSrcSet },
  } = getImageProps({ ...common, src: heroDesktop });
  const {
    props: { srcSet: mobileSrcSet, ...imgProps },
  } = getImageProps({ ...common, src: heroMobile, fetchPriority: "high", loading: "eager" });

  return (
    <div className="relative lg:absolute lg:inset-0">
      <picture className="lg:block lg:h-full">
        <source media="(min-width: 1024px)" srcSet={desktopSrcSet} sizes={common.sizes} />
        {/* eslint-disable-next-line jsx-a11y/alt-text -- alt comes from getImageProps */}
        <img
          {...imgProps}
          srcSet={mobileSrcSet}
          className="block h-[45vh] w-full object-cover object-center lg:h-full lg:object-right"
        />
      </picture>

      {/* Below lg: a short fade on the bottom edge only, so the photo runs
          into the text block below it. The rest of the image has no overlay. */}
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-x-0 bottom-0 h-[15%] bg-gradient-to-t from-hero to-transparent lg:hidden"
      />
    </div>
  );
}

// All from the data cache (lib/site-data.ts) and fetched in parallel, so a
// normal request does not touch the database.
async function getHomeData() {
  const [menu, reviews, creatorVideos, settings] = await Promise.all([
    getMenu(),
    getPublicReviews(),
    getCreatorVideos(),
    getSiteSettings(),
  ]);

  // Oldest first across the whole menu (ISO date strings sort correctly).
  const items = menu
    .flatMap((category) => category.menuItems)
    .sort((a, b) => String(a.createdAt).localeCompare(String(b.createdAt)));
  const featured = items.filter((item) => item.isFeatured);

  return {
    // Items marked Best Seller, or the first four when none are marked.
    bestSellers: (featured.length > 0 ? featured : items).slice(0, 4),
    categories: menu.filter((category) => category.menuItems.length > 0),
    newItem: items.find((item) => item.name === NEW_ITEM_NAME) ?? null,
    reviews,
    creatorVideos,
    settings,
  };
}

export default async function HomePage() {
  // Rendered per request because open/closed depends on the current time;
  // the data itself comes from the cache.
  await connection();
  const { bestSellers, categories, newItem, reviews, creatorVideos, settings } = await getHomeData();
  const info = buildInfo(settings);
  const faqs = buildFaqs(settings);
  const whatsappHref = whatsappLink(settings.whatsappNumber);
  const instagram = instagramProfile(settings.instagramUrl);
  const summary = reviewSummary(reviews);

  return (
    <main>
      {/* 1. Hero: light. #FDF7EF matches the photo's own background, so the
          image edges blend into the section. */}
      <section className="relative overflow-hidden bg-hero lg:flex lg:min-h-[85vh] lg:items-center">
        <HeroImage />

        {/* Desktop: soft wash on the left so the text stays readable. */}
        <div
          aria-hidden="true"
          className="pointer-events-none absolute inset-0 hidden bg-gradient-to-r from-hero from-20% via-hero/70 via-36% to-transparent to-54% lg:block"
        />

        {/* Below lg the text sits under the image on the solid hero colour;
            from lg up it is the left column over the full-bleed background. */}
        <div className="relative z-10 px-4 pb-4 pt-2 lg:mx-auto lg:w-full lg:max-w-6xl lg:py-24">
          <div className="max-w-xl">
            <p className="inline-flex items-center gap-2 whitespace-nowrap rounded-full border border-brand/30 bg-card/80 px-3 py-1 text-xs font-semibold text-brand-ink backdrop-blur-sm lg:py-1.5 lg:text-sm">
              <span className="h-2 w-2 rounded-full bg-brand" aria-hidden="true" />
              <span>
                {settings.hoursText}
                <span className="hidden lg:inline"> in Bashundhara R/A</span>
              </span>
            </p>

            <h1 className="mt-2.5 font-display text-[2.5rem] leading-[0.95] tracking-wide text-fg lg:mt-5 lg:text-8xl lg:leading-[0.92]">
              <span className="block lg:inline">Late Night</span>{" "}
              <span className="text-brand-ink">Hungry?</span>
            </h1>

            <p className="mt-4 hidden text-2xl font-semibold text-fg/80 lg:block">
              Fast Bites, Big Delight
            </p>

            <div className="mt-4 flex items-center gap-3 lg:mt-8">
              <Link
                href="/menu"
                className="inline-flex h-12 min-w-0 flex-1 items-center justify-center whitespace-nowrap rounded-full bg-brand px-6 font-display text-2xl tracking-wider text-fg shadow-lg shadow-brand/30 transition hover:bg-brand-hover active:scale-[0.98] lg:h-14 lg:flex-none lg:px-10"
              >
                Order Now
              </Link>
              {whatsappHref && (
                <a
                  href={whatsappHref}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="hidden h-14 shrink-0 items-center justify-center gap-2 whitespace-nowrap rounded-full border border-line bg-card px-8 font-semibold text-fg shadow-soft transition hover:border-fg/30 lg:inline-flex"
                >
                  <WhatsAppIcon width={22} height={22} className="text-[#0E7A3D]" />
                  WhatsApp Us
                </a>
              )}
            </div>
          </div>
        </div>
      </section>

      {/* Phones and tablets: the three info points not already in the hero
          (hours are in the tag, WhatsApp is the round button). */}
      <section aria-label="Delivery info" className="border-b border-line bg-hero lg:hidden">
        <ul className="mx-auto grid max-w-6xl grid-cols-3 gap-2 px-4 py-3">
          {mobileChips.map(({ icon: Icon, label }) => (
            <li
              key={label}
              className="flex min-w-0 items-center justify-center gap-1.5 whitespace-nowrap rounded-full border border-line bg-card px-2 py-2 text-[11px] font-semibold text-fg/90 min-[375px]:text-xs"
            >
              <Icon width={14} height={14} className="shrink-0 text-brand-ink" />
              {label}
            </li>
          ))}
        </ul>
      </section>

      {/* 2. Info strip */}
      <section aria-label="Delivery info" className="hidden border-y border-line bg-alt lg:block">
        <ul className="mx-auto grid max-w-6xl grid-cols-1 divide-y divide-line px-4 sm:grid-cols-2 sm:divide-y-0 lg:grid-cols-5">
          {info.map(({ icon: Icon, title, detail, href }) => {
            const content = (
              <>
                <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-brand/15 text-brand-ink sm:h-10 sm:w-10">
                  <Icon width={18} height={18} />
                </span>
                <span className="min-w-0">
                  <span className="block text-sm font-semibold text-fg sm:text-base">{title}</span>
                  <span className="block text-xs text-muted sm:text-sm">{detail}</span>
                </span>
              </>
            );

            return (
              <li key={title}>
                {href ? (
                  <a href={href} className="flex items-center gap-3 py-3 hover:opacity-90 sm:py-4 lg:py-6">
                    {content}
                  </a>
                ) : (
                  <div className="flex items-center gap-3 py-3 sm:py-4 lg:py-6">{content}</div>
                )}
              </li>
            );
          })}
        </ul>
      </section>

      {/* 3. Best sellers */}
      {bestSellers.length > 0 && (
        <section className="mx-auto max-w-6xl px-4 py-8 sm:py-16">
          <Reveal className="flex items-end justify-between gap-4">
            <SectionHeading eyebrow="Most ordered" title="Best Sellers" />
            <Link
              href="/menu"
              className="shrink-0 whitespace-nowrap text-sm font-semibold text-brand-ink hover:underline sm:text-base"
            >
              See all →
            </Link>
          </Reveal>

          {/* Phones: a swipe row showing about 1.5 cards. sm and up: a grid. */}
          <ul className="-mx-4 mt-5 flex snap-x snap-mandatory scroll-px-4 gap-3 overflow-x-auto px-4 pb-2 [scrollbar-width:none] sm:mx-0 sm:mt-8 sm:grid sm:grid-cols-2 sm:gap-4 sm:overflow-visible sm:px-0 sm:pb-0 lg:grid-cols-4 [&::-webkit-scrollbar]:hidden">
            {bestSellers.map((item, index) => (
              <Reveal
                as="li"
                key={item.id}
                delay={index * 80}
                className="w-[62%] shrink-0 snap-start sm:w-auto"
              >
                <MenuCard item={item} />
              </Reveal>
            ))}
          </ul>
        </section>
      )}

      {/* 4. Category shortcuts: round images in one swipe row on phones,
          one centered row on desktop. */}
      {categories.length > 0 && (
        <section className="mx-auto max-w-6xl px-4 pb-8 sm:pb-16">
          <Reveal>
            <SectionHeading eyebrow="Craving something?" title="Browse by Category" />
          </Reveal>

          <ul className="-mx-4 mt-5 flex snap-x snap-mandatory scroll-px-4 gap-4 overflow-x-auto px-4 pb-2 [scrollbar-width:none] sm:mt-8 lg:mx-0 lg:flex-wrap lg:justify-center lg:gap-10 lg:overflow-visible lg:px-0 [&::-webkit-scrollbar]:hidden">
            {categories.map((category) => (
              <li key={category.id} className="shrink-0 snap-start">
                <Link
                  href={`/menu?category=${encodeURIComponent(category.name)}`}
                  className="group flex w-[76px] flex-col items-center gap-2 pt-1 lg:w-24"
                  aria-label={`${category.name} menu`}
                >
                  <CategoryCircle
                    src={categoryImage(category)}
                    sizes="(min-width: 1024px) 96px, 72px"
                    className="h-[72px] w-[72px] lg:h-24 lg:w-24"
                  />
                  <span className="w-full truncate text-center text-xs font-semibold text-fg/90 group-hover:text-brand-ink lg:text-sm">
                    {categoryShortName(category)}
                  </span>
                </Link>
              </li>
            ))}
          </ul>
        </section>
      )}

      {/* 5. New item banner */}
      <section className="mx-auto max-w-6xl px-4 pb-8 sm:pb-16">
        <Reveal className="relative grid overflow-hidden rounded-3xl border border-brand/25 bg-gradient-to-br from-[#ffe1c2] via-card to-card shadow-soft sm:rounded-[2rem] md:grid-cols-2">
          <div className="relative z-10 p-5 sm:p-10">
            <span className="inline-block rounded-full bg-highlight px-3 py-1 text-xs font-bold uppercase tracking-wider text-fg">
              New
            </span>
            <h2 className="mt-3 font-display text-4xl leading-none tracking-wide sm:mt-4 sm:text-6xl">
              {NEW_ITEM_NAME}
            </h2>
            <p className="mt-2 line-clamp-3 max-w-sm text-sm text-fg/85 sm:mt-3 sm:text-base">
              {newItem?.description ??
                "Mini burgers with juicy patty, BBQ sauce, cheese and lettuce. Small size, big flavor."}
            </p>
            <p
              data-nowrap
              className="mt-4 whitespace-nowrap font-display text-3xl tracking-wide text-highlight-ink sm:mt-5 sm:text-4xl"
            >
              {formatPrice(newItem?.price ?? NEW_ITEM_PRICE)}
            </p>
            <div className="mt-4 flex flex-wrap gap-3 sm:mt-6">
              {newItem ? (
                <AddToCartButton item={newItem} />
              ) : (
                <Link
                  href="/menu"
                  className="inline-flex h-12 items-center rounded-full bg-brand px-6 font-semibold text-fg hover:bg-brand-hover"
                >
                  Order Now
                </Link>
              )}
            </div>
          </div>

          <div className="relative min-h-52 sm:min-h-64 md:min-h-full">
            <FallbackImage
              src="/menu/bbq-micro-burger.webp"
              alt={NEW_ITEM_NAME}
              sizes="(min-width: 768px) 50vw, 100vw"
            />
          </div>
        </Reveal>
      </section>

      {/* 6. Why Bitezz */}
      <section className="border-y border-line bg-alt">
        <div className="mx-auto max-w-6xl px-4 py-8 sm:py-16">
          <Reveal>
            <SectionHeading eyebrow="Why us" title="Why Bitezz" />
          </Reveal>
          <ul className="mt-5 grid grid-cols-2 gap-2.5 sm:mt-8 sm:gap-4 lg:grid-cols-4">
            {reasons.map(({ icon: Icon, title, text }, index) => (
              <Reveal
                as="li"
                key={title}
                delay={index * 80}
                className="rounded-2xl border border-line bg-card p-3 shadow-soft sm:p-5"
              >
                <span className="flex h-8 w-8 items-center justify-center rounded-xl bg-brand/15 text-brand-ink sm:h-12 sm:w-12 sm:rounded-2xl">
                  <Icon width={18} height={18} className="sm:h-6 sm:w-6" />
                </span>
                <h3 className="mt-2 whitespace-nowrap font-display text-xl tracking-wide sm:mt-4 sm:text-3xl">
                  {title}
                </h3>
                <p className="mt-0.5 text-xs leading-snug text-muted sm:mt-1 sm:text-sm">{text}</p>
              </Reveal>
            ))}
          </ul>
        </div>
      </section>

      {/* 7. How to order */}
      <section className="mx-auto max-w-6xl px-4 py-8 sm:py-16">
        <Reveal>
          <SectionHeading eyebrow="Easy as 1, 2, 3" title="How to Order" />
        </Reveal>
        {/* Phones: one compact row of three. The step detail shows from sm up. */}
        <ol className="mt-5 grid grid-cols-3 gap-2 sm:mt-8 sm:gap-4">
          {steps.map((step, index) => (
            <Reveal
              as="li"
              key={step.title}
              delay={index * 100}
              className="relative rounded-2xl border border-line bg-card p-3 shadow-soft text-center sm:p-6 sm:text-left"
            >
              <span className="font-display text-4xl leading-none text-brand-ink sm:text-6xl">{index + 1}</span>
              <h3 className="mt-1 text-xs font-semibold leading-tight sm:mt-3 sm:text-lg">{step.title}</h3>
              <p className="mt-1 hidden text-sm text-muted sm:block">{step.text}</p>
            </Reveal>
          ))}
        </ol>
      </section>

      {/* 8. Delivery area */}
      <section className="mx-auto max-w-6xl px-4 pb-8 sm:pb-16">
        <Reveal className="grid gap-4 rounded-3xl border border-line bg-card p-4 shadow-soft sm:gap-6 sm:rounded-[2rem] sm:p-10 md:grid-cols-[1.2fr_1fr] md:items-center">
          <div>
            <SectionHeading eyebrow="Where we deliver" title="Delivery Area">
              We deliver only inside Bashundhara R/A so every order arrives hot.
            </SectionHeading>
            <ul className="mt-3 flex flex-wrap gap-1.5 sm:mt-6 sm:gap-2">
              {DELIVERY_ZONES.filter((zone) => zone !== "NISS").map((zone) => (
                <li
                  key={zone}
                  className="flex items-center gap-1 whitespace-nowrap rounded-full border border-line bg-alt px-2.5 py-1 text-xs font-semibold sm:gap-1.5 sm:px-4 sm:py-2 sm:text-sm"
                >
                  <PinIcon width={14} height={14} className="shrink-0 text-brand-ink" /> {zone}
                </li>
              ))}
            </ul>
          </div>

          <dl className="grid grid-cols-2 gap-2.5 sm:gap-3">
            <div className="rounded-2xl bg-alt p-3 sm:p-5">
              <dt className="text-xs text-muted sm:text-sm">Hours</dt>
              <dd className="mt-0.5 font-display text-2xl leading-tight tracking-wide text-highlight-ink sm:mt-1 sm:text-3xl">
                {settings.hoursText}
              </dd>
            </div>
            <div className="rounded-2xl bg-alt p-3 sm:p-5">
              <dt className="text-xs text-muted sm:text-sm">Delivery</dt>
              <dd className="mt-0.5 whitespace-nowrap font-display text-2xl tracking-wide text-highlight-ink sm:mt-1 sm:text-3xl">
                {feeLabel(settings.deliveryFee)}
              </dd>
            </div>
          </dl>
        </Reveal>
      </section>

      {/* Loved by Creators: hidden entirely when no video is visible */}
      {creatorVideos.length > 0 && (
        <section className="relative overflow-hidden bg-creators py-10 text-cream sm:py-16">
          {/* Soft orange glow behind the carousel */}
          <div
            aria-hidden="true"
            className="pointer-events-none absolute left-1/2 top-1/2 h-[420px] w-[min(90vw,720px)] -translate-x-1/2 -translate-y-1/3 rounded-full bg-brand/25 blur-[120px]"
          />

          <div className="relative mx-auto max-w-6xl px-4">
            <Reveal className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
              <div>
                <p className="text-xs font-semibold uppercase tracking-[0.2em] text-highlight sm:text-sm">
                  As seen on Instagram
                </p>
                <h2 className="mt-1 font-display text-4xl leading-none tracking-wide sm:text-6xl">
                  Loved by Creators
                </h2>
                <p className="mt-2 text-sm text-cream/75 sm:mt-3 sm:text-base">
                  Real reviews from Bashundhara&apos;s food creators
                </p>
              </div>

              {instagram && (
                <a
                  href={instagram.url}
                  target="_blank"
                  rel="noopener"
                  className="inline-flex h-11 shrink-0 items-center gap-2 self-start whitespace-nowrap rounded-full border border-cream/25 bg-cream/10 px-5 text-sm font-semibold text-cream transition hover:border-brand hover:bg-brand hover:text-fg sm:self-auto"
                >
                  <InstagramIcon width={18} height={18} />
                  Follow @{instagram.handle}
                </a>
              )}
            </Reveal>
          </div>

          <div className="relative">
            <CreatorVideos videos={creatorVideos} />
          </div>
        </section>
      )}

      {/* 9. Reviews: an endless two-row marquee. Hidden when there are none. */}
      {reviews.length > 0 && (
        <section className="border-y border-line bg-alt py-8 sm:py-16">
          <div className="mx-auto max-w-6xl px-4">
            <Reveal>
              <SectionHeading eyebrow="Straight from Bashundhara" title="What People Say" />
              <p className="mt-3 flex flex-wrap items-center gap-2 text-muted">
                <ReviewStars rating={Math.round(Number(summary.average))} className="text-xl" />
                <span>
                  <span className="font-semibold text-fg">{summary.average}</span> from {summary.count}{" "}
                  {summary.count === 1 ? "review" : "reviews"}
                </span>
              </p>
            </Reveal>
          </div>

          <div className="mt-6 sm:mt-8">
            <ReviewsMarquee reviews={reviews} />
          </div>

          <div className="mt-6 text-center sm:mt-8">
            <Link
              href="/reviews"
              className="inline-flex h-12 items-center rounded-full border border-fg/15 bg-card px-8 font-semibold text-fg shadow-soft transition hover:border-brand"
            >
              See all reviews
            </Link>
          </div>
        </section>
      )}

      {/* 10. FAQ */}
      <section id="faq" className="mx-auto max-w-3xl scroll-mt-20 px-4 py-8 sm:py-16">
        <Reveal>
          <SectionHeading eyebrow="Good to know" title="FAQ" />
        </Reveal>
        <Reveal className="mt-5 divide-y divide-line rounded-2xl border border-line bg-card shadow-soft sm:mt-8">
          {faqs.map((faq) => (
            <details key={faq.q} className="group px-4 sm:px-5">
              <summary className="flex cursor-pointer list-none items-center justify-between gap-3 py-4 text-sm font-semibold sm:gap-4 sm:py-5 sm:text-base [&::-webkit-details-marker]:hidden">
                {faq.q}
                <span
                  aria-hidden="true"
                  className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-alt text-brand-ink transition-transform group-open:rotate-45"
                >
                  +
                </span>
              </summary>
              <p className="pb-4 text-sm text-muted sm:pb-5 sm:text-base">{faq.a}</p>
            </details>
          ))}
        </Reveal>
      </section>
    </main>
  );
}
