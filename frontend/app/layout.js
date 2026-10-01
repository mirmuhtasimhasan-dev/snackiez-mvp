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

export const metadata = {
  title: {
    default: "Bitezz | Fast Bites, Big Delight",
    template: "%s | Bitezz",
  },
  description:
    "Late night cloud kitchen in Bashundhara R/A, Dhaka. Shawarma, burgers, fries and chicken, open till 4 AM.",
  icons: { icon: "/logo.png" },
};

export const viewport = {
  themeColor: "#110d0a",
};

export default function RootLayout({ children }) {
  return (
    <html lang="en" className={`${bebas.variable} ${inter.variable}`}>
      <body className="bg-ink font-sans text-cream antialiased">
        {children}
      </body>
    </html>
  );
}
