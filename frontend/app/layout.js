import { Bebas_Neue, Inter } from "next/font/google";
import "./globals.css";

const bebas = Bebas_Neue({
  weight: "400",
  subsets: ["latin"],
  variable: "--font-bebas",
  display: "swap",
});

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-inter",
  display: "swap",
});

// Opening hours are left out on purpose: they are editable in admin Settings.
const description =
  "Late night cloud kitchen in Bashundhara R/A, Dhaka. Shawarma, burgers, fries and chicken, delivered hot. Cash on Delivery or bKash.";

// Absolute base for the Open Graph image URL. Set SITE_URL in production;
// on Vercel the production domain is used automatically.
const siteUrl =
  process.env.SITE_URL ||
  (process.env.VERCEL_PROJECT_PRODUCTION_URL
    ? `https://${process.env.VERCEL_PROJECT_PRODUCTION_URL}`
    : "http://localhost:3000");

// Icons come from app/favicon.ico, app/icon.png and app/apple-icon.png, and
// the share image from app/opengraph-image.jpg (Next file conventions).
export const metadata = {
  metadataBase: new URL(siteUrl),
  title: {
    default: "Bitezz | Fast Bites, Big Delight",
    template: "%s | Bitezz",
  },
  description,
  applicationName: "Bitezz",
  openGraph: {
    type: "website",
    siteName: "Bitezz",
    locale: "en_BD",
    title: "Bitezz | Late Night Food Delivery in Bashundhara R/A",
    description,
    url: "/",
  },
  twitter: {
    card: "summary_large_image",
    title: "Bitezz | Late Night Food Delivery in Bashundhara R/A",
    description,
  },
};

export const viewport = {
  themeColor: "#ffffff",
};

export default function RootLayout({ children }) {
  return (
    <html lang="en" className={`${bebas.variable} ${inter.variable}`}>
      <body className="bg-page font-sans text-fg antialiased">
        {children}
      </body>
    </html>
  );
}
