import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { CheckIcon, WhatsAppIcon } from "@/app/components/icons";
import { getSiteSettings } from "@/lib/settings";
import { formatPrice, whatsappLink } from "@/lib/site";

export const metadata = {
  title: "Order placed",
  robots: { index: false, follow: false },
};

const ORDER_CODE_PATTERN = /^[A-Z]{2,4}-\d{4,10}$/;

export default async function OrderSuccessPage({ searchParams }) {
  const { code } = await searchParams;
  const { whatsappNumber } = await getSiteSettings();
  const orderCode = typeof code === "string" ? code.trim().toUpperCase() : "";

  const order = ORDER_CODE_PATTERN.test(orderCode)
    ? await prisma.order.findUnique({
        where: { orderCode },
        select: {
          orderCode: true,
          totalAmount: true,
          deliveryFee: true,
          items: {
            select: {
              id: true,
              quantity: true,
              price: true,
              menuItem: { select: { name: true } },
            },
          },
          payment: { select: { method: true } },
        },
      })
    : null;

  if (!order) {
    return (
      <main className="mx-auto max-w-md px-4 py-16 text-center">
        <h1 className="font-display text-5xl tracking-wide">Order not found</h1>
        <p className="mt-2 text-muted">
          We couldn&apos;t find that order.
          {whatsappNumber && " If you just ordered, message us on WhatsApp and we'll check."}
        </p>
        <div className="mt-8 flex flex-col gap-3">
          {whatsappNumber && (
            <a
              href={whatsappLink(whatsappNumber)}
              className="flex h-12 items-center justify-center gap-2 rounded-full bg-[#25D366] font-semibold text-black hover:brightness-110"
            >
              <WhatsAppIcon /> WhatsApp {whatsappNumber}
            </a>
          )}
          <Link href="/menu" className="flex h-12 items-center justify-center rounded-full border border-line font-semibold hover:bg-fg/5">
            Back to Menu
          </Link>
        </div>
      </main>
    );
  }

  const subtotal = order.totalAmount - order.deliveryFee;
  const message = `Hi Bitezz! I just placed order ${order.orderCode}.`;

  return (
    <main className="mx-auto max-w-md px-4 py-12">
      <div className="text-center">
        <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-brand text-fg shadow-lg shadow-brand/40">
          <CheckIcon width={32} height={32} strokeWidth={3} />
        </div>
        <h1 className="mt-6 font-display text-5xl tracking-wide">Order placed!</h1>
        <p className="mt-2 text-muted">
          {order.payment?.method === "BKASH"
            ? "We'll verify your bKash payment and start cooking."
            : "The kitchen is on it. Keep cash ready for the rider."}
        </p>
      </div>

      <div className="mt-8 rounded-2xl border border-line bg-card p-5 shadow-soft">
        <p className="text-center text-sm text-muted">Your order code</p>
        <p className="mt-1 text-center font-display text-5xl tracking-widest text-brand-ink">
          {order.orderCode}
        </p>

        <ul className="mt-5 divide-y divide-line border-t border-line text-sm">
          {order.items.map((item) => (
            <li key={item.id} className="flex justify-between gap-3 py-2.5">
              <span className="text-fg/90">
                {item.menuItem.name} <span className="text-muted">× {item.quantity}</span>
              </span>
              <span className="shrink-0 tabular-nums">{formatPrice(item.price * item.quantity)}</span>
            </li>
          ))}
        </ul>

        <dl className="space-y-2 border-t border-line pt-3 text-sm">
          <div className="flex justify-between text-fg/80">
            <dt>Subtotal</dt>
            <dd className="tabular-nums">{formatPrice(subtotal)}</dd>
          </div>
          <div className="flex justify-between text-fg/80">
            <dt>Delivery fee</dt>
            <dd className="tabular-nums">{formatPrice(order.deliveryFee)}</dd>
          </div>
          <div className="flex justify-between border-t border-line pt-2 text-base font-bold">
            <dt>Total</dt>
            <dd className="tabular-nums">{formatPrice(order.totalAmount)}</dd>
          </div>
        </dl>
      </div>

      <div className="mt-6 flex flex-col gap-3">
        {whatsappNumber && (
          <a
            href={whatsappLink(whatsappNumber, message)}
            target="_blank"
            rel="noopener noreferrer"
            className="flex h-13 items-center justify-center gap-2 rounded-full bg-[#25D366] py-3.5 font-semibold text-black transition hover:brightness-110"
          >
            <WhatsAppIcon /> Message us on WhatsApp
          </a>
        )}
        <Link
          href="/menu"
          className="flex h-12 items-center justify-center rounded-full border border-line font-semibold hover:bg-fg/5"
        >
          Back to Menu
        </Link>
      </div>

      {whatsappNumber && (
        <p className="mt-4 text-center text-xs text-muted">
          Send us your order code for updates: {whatsappNumber}
        </p>
      )}
    </main>
  );
}
