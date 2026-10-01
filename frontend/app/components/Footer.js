import Image from "next/image";
import Link from "next/link";
import logo from "@/public/logo.png";
import { WhatsAppIcon } from "./icons";
import {
  AREA,
  DELIVERY_ZONES,
  FACEBOOK_URL,
  HOURS,
  WHATSAPP_NUMBER,
  whatsappLink,
} from "@/lib/site";

export default function Footer() {
  return (
    <footer className="mt-auto border-t border-line bg-surface">
      <div className="mx-auto grid max-w-6xl grid-cols-2 gap-x-4 gap-y-5 px-4 py-6 sm:grid-cols-3 sm:gap-8 sm:py-10">
        <div className="col-span-2 sm:col-span-1">
          <Link href="/" className="flex items-center gap-2">
            <Image src={logo} alt="" width={44} height={44} className="h-9 w-9 sm:h-11 sm:w-11" />
            <span className="font-display text-2xl tracking-wide sm:text-3xl">Bitezz</span>
          </Link>
          <p className="mt-1 text-sm text-muted sm:mt-2">Fast Bites, Big Delight</p>
        </div>

        <div className="min-w-0 text-xs sm:text-sm">
          <h2 className="font-display text-lg tracking-wide text-highlight sm:text-xl">Hours & area</h2>
          <p className="mt-1 text-cream/90 sm:mt-2">{HOURS}</p>
          <p className="mt-1 text-muted">{AREA}</p>
          <p className="mt-1 text-muted">Delivering to {DELIVERY_ZONES.slice(1).join(", ")} and all of Bashundhara</p>
        </div>

        <div className="min-w-0 text-xs sm:text-sm">
          <h2 className="font-display text-lg tracking-wide text-highlight sm:text-xl">Contact</h2>
          <a
            href={whatsappLink()}
            target="_blank"
            rel="noopener noreferrer"
            className="mt-1.5 flex items-center gap-1.5 whitespace-nowrap text-cream/90 hover:text-brand sm:mt-2 sm:gap-2"
          >
            <WhatsAppIcon width={16} height={16} className="shrink-0" /> {WHATSAPP_NUMBER}
          </a>
          <a
            href={FACEBOOK_URL}
            target="_blank"
            rel="noopener noreferrer"
            className="mt-1.5 flex items-center gap-1.5 whitespace-nowrap text-cream/90 hover:text-brand sm:mt-2 sm:gap-2"
          >
            <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true" className="shrink-0">
              <path d="M13.5 21v-7.5H16l.4-3h-2.9V8.6c0-.9.3-1.5 1.5-1.5h1.6V4.4c-.3 0-1.2-.1-2.3-.1-2.3 0-3.8 1.4-3.8 3.9v2.3H8v3h2.5V21h3Z" />
            </svg>
            facebook.com/bitezzbd
          </a>
        </div>
      </div>

      <p className="border-t border-line px-4 py-3 text-center text-xs text-muted sm:py-4">
        © {new Date().getFullYear()} Bitezz. All rights reserved.
      </p>
    </footer>
  );
}
