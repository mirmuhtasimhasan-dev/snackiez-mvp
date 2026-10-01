import Image from "next/image";
import Link from "next/link";
import logo from "@/public/logo.png";
import { FacebookIcon, InstagramIcon, PhoneIcon, TikTokIcon, WhatsAppIcon } from "./icons";
import { AREA, DELIVERY_ZONES, telLink, whatsappLink } from "@/lib/site";

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
    {
      label: `Call Bitezz on ${settings.phoneNumber}`,
      href: telLink(settings.phoneNumber),
      icon: PhoneIcon,
      hover: "hover:border-brand hover:bg-brand hover:text-fg",
      newTab: false,
    },
  ].filter((button) => button.href);
}

export default function Footer({ settings }) {
  const buttons = contactButtons(settings);

  return (
    <footer className="mt-auto bg-espresso text-cream">
      <div className="mx-auto grid max-w-6xl grid-cols-1 gap-5 px-4 py-6 sm:grid-cols-3 sm:gap-8 sm:py-10">
        <div>
          <Link href="/" className="flex items-center gap-2">
            <Image src={logo} alt="" width={44} height={44} className="h-9 w-9 sm:h-11 sm:w-11" />
            <span className="font-display text-2xl tracking-wide sm:text-3xl">Bitezz</span>
          </Link>
          <p className="mt-1 text-sm text-cream/70 sm:mt-2">Fast Bites, Big Delight</p>
        </div>

        <div className="min-w-0 text-xs sm:text-sm">
          <h2 className="font-display text-lg tracking-wide text-highlight sm:text-xl">Hours & area</h2>
          <p className="mt-1 text-cream/90 sm:mt-2">{settings.hoursText}</p>
          <p className="mt-1 text-cream/70">{AREA}</p>
          <p className="mt-1 text-cream/70">
            Delivering to {DELIVERY_ZONES.slice(1).join(", ")} and all of Bashundhara
          </p>
        </div>

        {buttons.length > 0 && (
          <div className="min-w-0">
            <h2 className="font-display text-lg tracking-wide text-highlight sm:text-xl">Contact</h2>
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

      <p className="border-t border-cream/10 px-4 py-3 text-center text-xs text-cream/70 sm:py-4">
        © {new Date().getFullYear()} Bitezz. All rights reserved.
      </p>
    </footer>
  );
}
