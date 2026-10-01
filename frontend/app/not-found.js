import Image from "next/image";
import Link from "next/link";
import logo from "@/public/logo.png";
import { getSiteSettings } from "@/lib/settings";
import { whatsappLink } from "@/lib/site";

export const metadata = {
  title: "Page not found",
  robots: { index: false, follow: false },
};

export default async function NotFound() {
  const { whatsappNumber } = await getSiteSettings();

  return (
    <main className="flex min-h-dvh flex-col items-center justify-center bg-page px-4 py-12 text-center">
      <Link href="/" aria-label="Bitezz home">
        <Image src={logo} alt="Bitezz" width={112} height={112} className="h-28 w-28" />
      </Link>

      <p className="mt-6 font-display text-7xl leading-none tracking-wide text-brand">404</p>
      <h1 className="mt-2 font-display text-4xl tracking-wide sm:text-5xl">This page got eaten</h1>
      <p className="mt-2 max-w-sm text-muted">
        We couldn&apos;t find what you were looking for. The kitchen is still open though.
      </p>

      <div className="mt-8 flex w-full max-w-xs flex-col gap-3">
        <Link
          href="/menu"
          className="flex h-12 items-center justify-center rounded-full bg-brand font-display text-2xl tracking-wider text-fg transition hover:bg-brand-hover"
        >
          See the Menu
        </Link>
        <Link
          href="/"
          className="flex h-12 items-center justify-center rounded-full border border-line bg-card font-semibold text-fg shadow-soft hover:bg-alt"
        >
          Back to Home
        </Link>
      </div>

      {whatsappNumber && (
        <a
          href={whatsappLink(whatsappNumber)}
          className="mt-6 text-sm font-semibold text-brand-ink hover:underline"
        >
          Need help? WhatsApp {whatsappNumber}
        </a>
      )}
    </main>
  );
}
