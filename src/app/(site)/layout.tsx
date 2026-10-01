import { Header } from "@/components/site/Header";
import { Footer } from "@/components/site/Footer";
import { CartDrawer } from "@/components/cart/CartDrawer";
import { PreviewBridge } from "@/components/site/PreviewBridge";

export default function SiteLayout({ children }: LayoutProps<"/">) {
  return (
    <>
      <Header />
      <main className="flex-1">{children}</main>
      <Footer />
      <CartDrawer />
      <PreviewBridge />
    </>
  );
}
