import { CartProvider } from "@/app/components/CartProvider";
import CartDrawer from "@/app/components/CartDrawer";
import ClosedBanner from "@/app/components/ClosedBanner";
import Navbar from "@/app/components/Navbar";
import Footer from "@/app/components/Footer";
import MobileActions from "@/app/components/MobileActions";
import { StoreProvider } from "@/app/components/StoreProvider";
import { getSiteSettings } from "@/lib/settings";
import { getStoreStatus } from "@/lib/store-hours";

export default async function SiteLayout({ children }) {
  const settings = await getSiteSettings();

  return (
    <StoreProvider settings={settings} initialStatus={getStoreStatus(settings)}>
      <CartProvider>
        <div className="flex min-h-dvh flex-col">
          <ClosedBanner />
          <Navbar />
          <div className="flex-1">{children}</div>
          <Footer settings={settings} />
          <MobileActions />
        </div>
        <CartDrawer />
      </CartProvider>
    </StoreProvider>
  );
}
