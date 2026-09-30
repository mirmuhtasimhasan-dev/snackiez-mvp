import { getImageProps } from "next/image";
import Link from "next/link";
import { connection } from "next/server";
import heroDesktop from "@/public/hero-bg.webp";
import heroMobile from "@/public/hero-bg-mobile.webp";
import { prisma } from "@/lib/prisma";
import { DELIVERY_FEE } from "@/lib/order-config";
import {
  DELIVERY_ZONES,
  HOURS,
  WHATSAPP_NUMBER,
  formatPrice,
  whatsappLink,
} from "@/lib/site";
import AddToCartButton from "@/app/components/AddToCartButton";
import FallbackImage from "@/app/components/FallbackImage";
import MenuCard from "@/app/components/MenuCard";
import Reveal from "@/app/components/Reveal";
import {
  BagIcon,
  CashIcon,
  CheckIcon,
  ClockIcon,
  MoonIcon,
  PinIcon,
  WhatsAppIcon,
} from "@/app/components/icons";

export const metadata = {
  title: { absolute: "Bitezz | Late Night Food Delivery in Bashundhara R/A" },
};

const NEW_ITEM_NAME = "BBQ Micro Burger";
const NEW_ITEM_PRICE = 289;

const menuCardSelect = {
  id: true,
  name: true,
  description: true,
  price: true,
  image: true,
  isAvailable: true,
  stockQty: true,
};

const info = [
  { icon: MoonIcon, title: "Late Night Delivery", detail: "Cravings after midnight? We got you." },
  { icon: ClockIcon, title: HOURS, detail: "Hot food, every night." },
  { icon: PinIcon, title: "Bashundhara R/A only", detail: "NSU, IUB, NISS and around" },
  { icon: CashIcon, title: "Cash on Delivery", detail: "Or pay with bKash" },
  {
    icon: WhatsAppIcon,
    title: `WhatsApp ${WHATSAPP_NUMBER}`,
    detail: "Questions? Message us",
    href: whatsappLink(),
  },
];

const reasons = [
  { icon: MoonIcon, title: "Late Night", text: "Kitchen stays open till 4 AM for study nights and midnight cravings." },
  { icon: CheckIcon, title: "Fresh Made", text: "Every order is cooked when you place it. Nothing sits under a lamp." },
  { icon: BagIcon, title: "Fast Delivery", text: "We only deliver inside Bashundhara, so food reaches you hot." },
  { icon: CashIcon, title: "COD or bKash", text: "Pay cash at the door or send money with bKash. Your choice." },
];

const steps = [
  { title: "Pick your food", text: "Browse the menu and add what you crave to the cart." },
  { title: "Check out", text: "Enter your name, phone and Bashundhara address. Choose COD or bKash." },
  { title: "Eat it hot", text: "We cook it fresh and our rider brings it to your door." },
];

const faqs = [
  {
    q: "How long does delivery take?",
    a: "Usually within 30 minutes inside Bashundhara R/A. Late night rush can take a little longer.",
  },
  {
    q: "What is the delivery charge?",
    a: `A flat ${formatPrice(DELIVERY_FEE)} on every order, shown at checkout before you place it.`,
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

function SectionHeading({ eyebrow, title, children }) {
  return (
    <div className="max-w-2xl">
      {eyebrow && (
        <p className="text-sm font-semibold uppercase tracking-[0.2em] text-highlight">{eyebrow}</p>
      )}
      <h2 className="mt-1 font-display text-5xl leading-none tracking-wide sm:text-6xl">{title}</h2>
      {children && <p className="mt-3 text-muted">{children}</p>}
    </div>
  );
}

function Stars({ rating }) {
  return (
    <p className="text-lg leading-none text-highlight" aria-label={`${rating} out of 5 stars`}>
      {"★".repeat(rating)}
      <span className="text-line">{"★".repeat(5 - rating)}</span>
    </p>
  );
}

// Art-directed hero: phones get the tighter crop in the page flow, desktops
// get the wide shot as a full-bleed background. <picture> means each device
// downloads only its own image. fetchPriority replaces preload here, since
// which image is the LCP depends on the viewport.
function HeroImage() {
  const common = {
    alt: "Shawarma wrap, crispy chicken burger, fries and fried chicken tenders",
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
          className="block h-auto w-full lg:h-full lg:object-cover lg:object-right"
        />
      </picture>

      {/* Mobile: soften the image's bottom edge into the page before the text. */}
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-x-0 bottom-0 h-16 bg-gradient-to-t from-ink to-transparent lg:hidden"
      />
    </div>
  );
}

async function getHomeData() {
  const featured = await prisma.menuItem.findMany({
    where: { isFeatured: true },
    orderBy: { createdAt: "asc" },
    take: 4,
    select: menuCardSelect,
  });

  const [bestSellers, categories, newItem, reviews] = await Promise.all([
    featured.length > 0
      ? featured
      : prisma.menuItem.findMany({ orderBy: { createdAt: "asc" }, take: 4, select: menuCardSelect }),
    prisma.category.findMany({
      where: { menuItems: { some: {} } },
      orderBy: { createdAt: "asc" },
      select: { id: true, name: true, _count: { select: { menuItems: true } } },
    }),
    prisma.menuItem.findFirst({
      where: { name: NEW_ITEM_NAME },
      select: { ...menuCardSelect, category: { select: { name: true } } },
    }),
    prisma.review.findMany({
      where: { isVisible: true },
      orderBy: [{ sortOrder: "asc" }, { createdAt: "asc" }],
    }),
  ]);

  return { bestSellers, categories, newItem, reviews };
}

export default async function HomePage() {
  // Best sellers show live stock, so render per request.
  await connection();
  const { bestSellers, categories, newItem, reviews } = await getHomeData();

  return (
    <main>
      {/* 1. Hero */}
      <section className="relative overflow-hidden lg:flex lg:min-h-[90vh] lg:items-center">
        <HeroImage />

        {/* Desktop: darken the left for the text and fade the bottom into the page. */}
        <div
          aria-hidden="true"
          className="pointer-events-none absolute inset-0 hidden bg-gradient-to-r from-ink from-20% via-ink/70 via-45% to-transparent to-75% lg:block"
        />
        <div
          aria-hidden="true"
          className="pointer-events-none absolute inset-x-0 bottom-0 hidden h-48 bg-gradient-to-t from-ink to-transparent lg:block"
        />

        <div className="relative z-10 mx-auto w-full max-w-6xl px-4 pb-14 pt-6 lg:py-24">
          <div className="max-w-xl">
            <p className="inline-flex items-center gap-2 rounded-full border border-highlight/30 bg-highlight/10 px-3 py-1.5 text-sm font-semibold text-highlight">
              <span className="h-2 w-2 rounded-full bg-highlight" aria-hidden="true" />
              Open till 4 AM in Bashundhara R/A
            </p>

            <h1 className="mt-5 font-display text-6xl leading-[0.9] tracking-wide sm:text-7xl lg:text-8xl">
              Late Night Hungry? <span className="text-brand">We Deliver.</span>
            </h1>

            <p className="mt-5 max-w-md text-lg text-muted">
              Shawarma, burgers, loaded fries and crispy chicken, cooked fresh and
              delivered hot across Bashundhara.
            </p>

            <div className="mt-8 flex flex-col gap-3 sm:flex-row">
              <Link
                href="/menu"
                className="inline-flex h-14 items-center justify-center rounded-full bg-brand px-10 font-display text-2xl tracking-wider text-cream shadow-lg shadow-brand/30 transition hover:bg-brand-hover active:scale-[0.98]"
              >
                Order Now
              </Link>
              <a
                href={whatsappLink()}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex h-14 items-center justify-center gap-2 rounded-full border border-line bg-surface px-8 font-semibold text-cream transition hover:border-cream/30"
              >
                <WhatsAppIcon /> WhatsApp Us
              </a>
            </div>
          </div>
        </div>
      </section>

      {/* 2. Info strip */}
      <section aria-label="Delivery info" className="border-y border-line bg-surface">
        <ul className="mx-auto grid max-w-6xl grid-cols-1 divide-y divide-line px-4 sm:grid-cols-2 sm:divide-y-0 lg:grid-cols-5">
          {info.map(({ icon: Icon, title, detail, href }) => {
            const content = (
              <>
                <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-brand/15 text-brand">
                  <Icon />
                </span>
                <span className="min-w-0">
                  <span className="block font-semibold text-cream">{title}</span>
                  <span className="block text-sm text-muted">{detail}</span>
                </span>
              </>
            );

            return (
              <li key={title}>
                {href ? (
                  <a href={href} className="flex items-center gap-3 py-4 hover:opacity-90 lg:py-6">
                    {content}
                  </a>
                ) : (
                  <div className="flex items-center gap-3 py-4 lg:py-6">{content}</div>
                )}
              </li>
            );
          })}
        </ul>
      </section>

      {/* 3. Best sellers */}
      {bestSellers.length > 0 && (
        <section className="mx-auto max-w-6xl px-4 py-16">
          <Reveal className="flex flex-wrap items-end justify-between gap-4">
            <SectionHeading eyebrow="Most ordered" title="Best Sellers" />
            <Link href="/menu" className="font-semibold text-brand hover:underline">
              See full menu →
            </Link>
          </Reveal>

          <ul className="mt-8 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {bestSellers.map((item, index) => (
              <Reveal as="li" key={item.id} delay={index * 80}>
                <MenuCard item={item} />
              </Reveal>
            ))}
          </ul>
        </section>
      )}

      {/* 4. Category shortcuts */}
      {categories.length > 0 && (
        <section className="mx-auto max-w-6xl px-4 pb-16">
          <Reveal>
            <SectionHeading eyebrow="Craving something?" title="Browse by Category" />
          </Reveal>

          <ul className="mt-8 grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-5">
            {categories.map((category, index) => (
              <Reveal as="li" key={category.id} delay={index * 60}>
                <Link
                  href={`/menu?category=${encodeURIComponent(category.name)}`}
                  className="group flex h-full flex-col justify-between rounded-2xl border border-line bg-surface p-4 transition hover:border-brand/60 hover:bg-surface-2"
                >
                  <span className="font-display text-2xl leading-tight tracking-wide group-hover:text-brand">
                    {category.name}
                  </span>
                  <span className="mt-3 text-sm text-muted">
                    {category._count.menuItems} {category._count.menuItems === 1 ? "item" : "items"} →
                  </span>
                </Link>
              </Reveal>
            ))}
          </ul>
        </section>
      )}

      {/* 5. New item banner */}
      <section className="mx-auto max-w-6xl px-4 pb-16">
        <Reveal className="relative grid overflow-hidden rounded-[2rem] border border-brand/30 bg-gradient-to-br from-brand/25 via-surface to-surface md:grid-cols-2">
          <div className="relative z-10 p-6 sm:p-10">
            <span className="inline-block rounded-full bg-highlight px-3 py-1 text-xs font-bold uppercase tracking-wider text-ink">
              New
            </span>
            <h2 className="mt-4 font-display text-5xl leading-none tracking-wide sm:text-6xl">
              {NEW_ITEM_NAME}
            </h2>
            <p className="mt-3 max-w-sm text-cream/85">
              {newItem?.description ??
                "Mini burgers with juicy patty, BBQ sauce, cheese and lettuce. Small size, big flavor."}
            </p>
            <p className="mt-5 font-display text-4xl tracking-wide text-highlight">
              {formatPrice(newItem?.price ?? NEW_ITEM_PRICE)}
            </p>
            <div className="mt-6 flex flex-wrap gap-3">
              {newItem ? (
                <AddToCartButton item={newItem} />
              ) : (
                <Link
                  href="/menu"
                  className="inline-flex h-12 items-center rounded-full bg-brand px-6 font-semibold text-cream hover:bg-brand-hover"
                >
                  Order Now
                </Link>
              )}
            </div>
          </div>

          <div className="relative min-h-64 md:min-h-full">
            <FallbackImage
              src="/menu/bbq-micro-burger.webp"
              alt={NEW_ITEM_NAME}
              sizes="(min-width: 768px) 50vw, 100vw"
            />
          </div>
        </Reveal>
      </section>

      {/* 6. Why Bitezz */}
      <section className="border-y border-line bg-surface">
        <div className="mx-auto max-w-6xl px-4 py-16">
          <Reveal>
            <SectionHeading eyebrow="Why us" title="Why Bitezz" />
          </Reveal>
          <ul className="mt-8 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {reasons.map(({ icon: Icon, title, text }, index) => (
              <Reveal as="li" key={title} delay={index * 80} className="rounded-2xl border border-line bg-ink p-5">
                <span className="flex h-12 w-12 items-center justify-center rounded-2xl bg-brand/15 text-brand">
                  <Icon width={24} height={24} />
                </span>
                <h3 className="mt-4 font-display text-3xl tracking-wide">{title}</h3>
                <p className="mt-1 text-sm text-muted">{text}</p>
              </Reveal>
            ))}
          </ul>
        </div>
      </section>

      {/* 7. How to order */}
      <section className="mx-auto max-w-6xl px-4 py-16">
        <Reveal>
          <SectionHeading eyebrow="Easy as 1, 2, 3" title="How to Order" />
        </Reveal>
        <ol className="mt-8 grid grid-cols-1 gap-4 md:grid-cols-3">
          {steps.map((step, index) => (
            <Reveal as="li" key={step.title} delay={index * 100} className="relative rounded-2xl border border-line bg-surface p-6">
              <span className="font-display text-6xl leading-none text-brand">{index + 1}</span>
              <h3 className="mt-3 text-lg font-semibold">{step.title}</h3>
              <p className="mt-1 text-sm text-muted">{step.text}</p>
            </Reveal>
          ))}
        </ol>
      </section>

      {/* 8. Delivery area */}
      <section className="mx-auto max-w-6xl px-4 pb-16">
        <Reveal className="grid gap-6 rounded-[2rem] border border-line bg-surface p-6 sm:p-10 md:grid-cols-[1.2fr_1fr] md:items-center">
          <div>
            <SectionHeading eyebrow="Where we deliver" title="Delivery Area">
              We deliver only inside Bashundhara R/A so every order arrives hot.
            </SectionHeading>
            <ul className="mt-6 flex flex-wrap gap-2">
              {DELIVERY_ZONES.map((zone) => (
                <li
                  key={zone}
                  className="flex items-center gap-1.5 rounded-full border border-line bg-ink px-4 py-2 text-sm font-semibold"
                >
                  <PinIcon width={16} height={16} className="text-brand" /> {zone}
                </li>
              ))}
            </ul>
          </div>

          <dl className="grid grid-cols-2 gap-3">
            <div className="rounded-2xl bg-ink p-5">
              <dt className="text-sm text-muted">Open</dt>
              <dd className="mt-1 font-display text-3xl tracking-wide text-highlight">Till 4 AM</dd>
            </div>
            <div className="rounded-2xl bg-ink p-5">
              <dt className="text-sm text-muted">Delivery</dt>
              <dd className="mt-1 font-display text-3xl tracking-wide text-highlight">
                {formatPrice(DELIVERY_FEE)}
              </dd>
            </div>
          </dl>
        </Reveal>
      </section>

      {/* 9. Reviews: hidden entirely when there are none */}
      {reviews.length > 0 && (
        <section className="border-y border-line bg-surface">
          <div className="mx-auto max-w-6xl px-4 py-16">
            <Reveal>
              <SectionHeading eyebrow="Straight from Bashundhara" title="What People Say" />
            </Reveal>
            <ul className="mt-8 grid grid-cols-1 gap-4 md:grid-cols-3">
              {reviews.map((review, index) => (
                <Reveal as="li" key={review.id} delay={index * 80} className="flex flex-col rounded-2xl border border-line bg-ink p-6">
                  <Stars rating={review.rating} />
                  <blockquote className="mt-4 flex-1 text-cream/90">“{review.text}”</blockquote>
                  <div className="mt-5 flex items-center gap-3">
                    {review.image && (
                      // Uploaded to Supabase Storage; any host, so a plain img.
                      // eslint-disable-next-line @next/next/no-img-element
                      <img
                        src={review.image}
                        alt=""
                        className="h-10 w-10 rounded-full object-cover"
                        loading="lazy"
                      />
                    )}
                    <div>
                      <p className="font-semibold">{review.name}</p>
                      {review.source && (
                        <p className="text-xs text-muted">via {review.source}</p>
                      )}
                    </div>
                  </div>
                </Reveal>
              ))}
            </ul>
          </div>
        </section>
      )}

      {/* 10. FAQ */}
      <section className="mx-auto max-w-3xl px-4 py-16">
        <Reveal>
          <SectionHeading eyebrow="Good to know" title="FAQ" />
        </Reveal>
        <Reveal className="mt-8 divide-y divide-line rounded-2xl border border-line bg-surface">
          {faqs.map((faq) => (
            <details key={faq.q} className="group px-5">
              <summary className="flex cursor-pointer list-none items-center justify-between gap-4 py-5 font-semibold [&::-webkit-details-marker]:hidden">
                {faq.q}
                <span
                  aria-hidden="true"
                  className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-ink text-brand transition-transform group-open:rotate-45"
                >
                  +
                </span>
              </summary>
              <p className="pb-5 text-muted">{faq.a}</p>
            </details>
          ))}
        </Reveal>
      </section>
    </main>
  );
}
