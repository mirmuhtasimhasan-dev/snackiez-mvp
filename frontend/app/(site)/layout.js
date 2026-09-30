import { CartProvider } from "@/app/components/CartProvider";
import CartDrawer from "@/app/components/CartDrawer";
import Navbar from "@/app/components/Navbar";
import Footer from "@/app/components/Footer";
import MobileActions from "@/app/components/MobileActions";

export default function SiteLayout({ children }) {
  return (
    <CartProvider>
      <div className="flex min-h-dvh flex-col">
        <Navbar />
        <div className="flex-1">{children}</div>
        <Footer />
        <MobileActions />
      </div>
      <CartDrawer />
    </CartProvider>
  );
}
