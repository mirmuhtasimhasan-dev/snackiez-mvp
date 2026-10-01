"use client";

import Image from "next/image";
import Link from "next/link";
import { usePathname } from "next/navigation";
import logo from "@/public/logo.png";

const links = [
  { href: "/admin", label: "Orders & Menu" },
  { href: "/admin/reviews", label: "Reviews" },
  { href: "/admin/settings", label: "Settings" },
];

function isActive(pathname, href) {
  const path = pathname.replace(/\/$/, "") || "/";
  return href === "/admin" ? path === "/admin" : path.startsWith(href);
}

export default function AdminSidebar() {
  const pathname = usePathname();

  if (pathname.replace(/\/$/, "") === "/admin/login") {
    return null;
  }

  return (
    <aside className="border-b border-gray-200 bg-white md:sticky md:top-0 md:h-screen md:w-60 md:shrink-0 md:border-b-0 md:border-r">
      <div className="flex items-center gap-2 px-4 py-4 md:px-5 md:py-6">
        <Image src={logo} alt="" width={32} height={32} className="h-8 w-8" />
        <span className="text-lg font-bold">Bitezz Admin</span>
      </div>

      <nav aria-label="Admin" className="flex gap-1 overflow-x-auto px-3 pb-3 md:flex-col md:px-3">
        {links.map((link) => {
          const active = isActive(pathname, link.href);

          return (
            <Link
              key={link.href}
              href={link.href}
              aria-current={active ? "page" : undefined}
              className={`shrink-0 rounded-lg px-3 py-2 text-sm font-semibold ${
                active
                  ? "bg-orange-50 text-orange-600"
                  : "text-gray-600 hover:bg-gray-100 hover:text-gray-900"
              }`}
            >
              {link.label}
            </Link>
          );
        })}
      </nav>
    </aside>
  );
}
