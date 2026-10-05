import Image from "next/image";
import Link from "next/link";
import logo from "@/public/logo.png";
import {
  CashIcon,
  FacebookIcon,
  InstagramIcon,
  PhoneIcon,
  TikTokIcon,
  WhatsAppIcon,
} from "./icons";
import { AREA, DELIVERY_ZONES, telLink, whatsappLink } from "@/lib/site";

const DEVELOPER_URL = "https://muhtasim-hasan.vercel.app";

// Round 44px buttons. Each shows only when its field is set in admin Settings,
// and takes on the platform's own colour on hover.
function contactButtons(settings) {
  return [
    {
      label: "Chat with Bitezz on WhatsApp",
      href: whatsappLink(settings.whatsappNumber),
      icon: WhatsAppIcon,
      hover: "hover:border-[#25D366] hover:bg-[#25D366] hover:text-black",
      newTab: true,
    },
    {
      label: `Call Bitezz on ${settings.phoneNumber}`,
      href: telLink(settings.phoneNumber),
      icon: PhoneIcon,
      hover: "hover:border-brand hover:bg-brand hover:text-fg",
      newTab: false,
    },
    {
      label: "Bitezz on Facebook",
      href: settings.facebookUrl,
      icon: FacebookIcon,
      hover: "hover:border-[#1877F2] hover:bg-[#1877F2] hover:text-white",
      newTab: true,
    },
    {
      label: "Bitezz on Instagram",
      href: settings.instagramUrl,
      icon: InstagramIcon,
      hover: "hover:border-[#E4405F] hover:bg-[#E4405F] hover:text-white",
      newTab: true,
    },
    {
      label: "Bitezz on TikTok",
      href: settings.tiktokUrl,
      icon: TikTokIcon,
      hover: "hover:border-[#25F4EE] hover:bg-[#25F4EE] hover:text-black",
      newTab: true,
    },
  ].filter((button) => button.href);
}

const headingClass = "font-display text-lg tracking-wide text-highlight sm:text-xl";
const linkClass = "text-cream/90 transition hover:text-brand";

export default function Footer({ settings }) {
  const buttons = contactButtons(settings);
  const orderOnWhatsApp = whatsappLink(settings.whatsappNumber, "Hi Bitezz! I'd like to place an order.");

  return (
    <footer className="mt-auto bg-espresso text-cream">
      {/* Phones: brand, then Hours and Quick Links side by side, then Contact.
          Desktop: four columns. */}
      <div className="mx-auto grid max-w-6xl grid-cols-2 gap-x-4 gap-y-6 px-4 py-6 sm:py-10 lg:grid-cols-4 lg:gap-8">
        <div className="col-span-2 lg:col-span-1">
          <Link href="/" className="flex items-center gap-2">
            <Image src={logo} alt="" width={44} height={44} className="h-9 w-9 sm:h-11 sm:w-11" />
            <span className="font-display text-2xl tracking-wide sm:text-3xl">Bitezz</span>
          </Link>
          <p className="mt-1 text-sm text-cream/70 sm:mt-2">Fast Bites, Big Delight</p>
        </div>

        <div className="min-w-0 text-xs sm:text-sm">
          <h2 className={headingClass}>Hours & area</h2>
          <p className="mt-1 text-cream/90 sm:mt-2">{settings.hoursText}</p>
          <p className="mt-1 text-cream/70">{AREA}</p>
          <p className="mt-1 text-cream/70">
            Delivering to {DELIVERY_ZONES.slice(1).join(", ")} and all of Bashundhara
          </p>

          <ul aria-label="Payment methods" className="mt-3 flex flex-wrap gap-1.5">
            <li className="flex items-center gap-1 whitespace-nowrap rounded-full border border-cream/20 px-2 py-1 text-[11px] font-semibold text-cream/90">
              <CashIcon width={14} height={14} className="shrink-0 text-highlight" />
              Cash on Delivery
            </li>
            <li className="flex items-center gap-1.5 whitespace-nowrap rounded-full border border-[#E2136E]/50 px-2 py-1 text-[11px] font-semibold text-cream/90">
              <span aria-hidden="true" className="h-2.5 w-2.5 shrink-0 rounded-[3px] bg-[#E2136E]" />
              bKash
            </li>
          </ul>
        </div>

        <nav aria-label="Quick links" className="min-w-0 text-xs sm:text-sm">
          <h2 className={headingClass}>Quick links</h2>
          <ul className="mt-1 space-y-1.5 sm:mt-2">
            <li>
              <Link href="/menu" className={linkClass}>
                Menu
              </Link>
            </li>
            <li>
              <Link href="/#faq" className={linkClass}>
                FAQ
              </Link>
            </li>
            {orderOnWhatsApp && (
              <li>
                <a href={orderOnWhatsApp} target="_blank" rel="noopener noreferrer" className={linkClass}>
                  Order on WhatsApp
                </a>
              </li>
            )}
          </ul>
        </nav>

        {buttons.length > 0 && (
          <div className="col-span-2 min-w-0 lg:col-span-1">
            <h2 className={headingClass}>Contact</h2>
            <ul className="mt-2 flex flex-wrap gap-2.5 sm:mt-3">
              {buttons.map(({ label, href, icon: Icon, hover, newTab }) => (
                <li key={label}>
                  <a
                    href={href}
                    aria-label={label}
                    title={label}
                    {...(newTab ? { target: "_blank", rel: "noopener noreferrer" } : {})}
                    className={`flex h-11 w-11 items-center justify-center rounded-full border border-cream/20 bg-cream/5 text-cream transition ${hover}`}
                  >
                    <Icon width={20} height={20} />
                  </a>
                </li>
              ))}
            </ul>
          </div>
        )}
      </div>

      <div className="border-t border-cream/10">
        <div className="mx-auto flex max-w-6xl flex-col items-center gap-1 px-4 py-3 text-center text-xs text-cream/70 sm:flex-row sm:justify-between sm:py-4 sm:text-left">
          <p>© {new Date().getFullYear()} Bitezz. All rights reserved.</p>
          <p>
            Designed & developed by{" "}
            <a
              href={DEVELOPER_URL}
              target="_blank"
              rel="noopener"
              className="font-medium transition hover:text-brand"
            >
              Muhtasim Hasan
            </a>
          </p>
        </div>
      </div>
    </footer>
  );
}
