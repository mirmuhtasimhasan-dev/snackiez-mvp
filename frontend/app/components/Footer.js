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
      <div className="mx-auto grid max-w-6xl gap-8 px-4 py-10 sm:grid-cols-3">
        <div>
          <Link href="/" className="flex items-center gap-2">
            <Image src={logo} alt="" width={44} height={44} className="h-11 w-11" />
            <span className="font-display text-3xl tracking-wide">Bitezz</span>
          </Link>
          <p className="mt-2 text-sm text-muted">Fast Bites, Big Delight</p>
        </div>

        <div className="text-sm">
          <h2 className="font-display text-xl tracking-wide text-highlight">Hours & area</h2>
          <p className="mt-2 text-cream/90">{HOURS}</p>
          <p className="mt-1 text-muted">{AREA}</p>
          <p className="mt-1 text-muted">Delivering to {DELIVERY_ZONES.slice(1).join(", ")} and all of Bashundhara</p>
        </div>

        <div className="text-sm">
          <h2 className="font-display text-xl tracking-wide text-highlight">Contact</h2>
          <a
            href={whatsappLink()}
            target="_blank"
            rel="noopener noreferrer"
            className="mt-2 flex items-center gap-2 text-cream/90 hover:text-brand"
          >
            <WhatsAppIcon width={18} height={18} /> WhatsApp {WHATSAPP_NUMBER}
          </a>
          <a
            href={FACEBOOK_URL}
            target="_blank"
            rel="noopener noreferrer"
            className="mt-2 flex items-center gap-2 text-cream/90 hover:text-brand"
          >
            <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
              <path d="M13.5 21v-7.5H16l.4-3h-2.9V8.6c0-.9.3-1.5 1.5-1.5h1.6V4.4c-.3 0-1.2-.1-2.3-.1-2.3 0-3.8 1.4-3.8 3.9v2.3H8v3h2.5V21h3Z" />
            </svg>
            facebook.com/bitezzbd
          </a>
        </div>
      </div>

      <p className="border-t border-line px-4 py-4 text-center text-xs text-muted">
        © {new Date().getFullYear()} Bitezz. All rights reserved.
      </p>
    </footer>
  );
}
