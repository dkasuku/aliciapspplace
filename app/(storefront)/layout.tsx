import { AgentPanel } from "@/components/agent-panel";
import { CartProvider } from "@/components/cart-provider";
import { CartToast } from "@/components/cart-toast";
import { FloatingCartButton } from "@/components/floating-cart-button";
import { SiteHeader } from "@/components/site-header";
import { getSiteContent } from "@/lib/site-content";

export const dynamic = "force-dynamic";

export default async function StorefrontLayout({ children }: { children: React.ReactNode }) {
  const siteContent = await getSiteContent();
  return (
    <CartProvider>
      <SiteHeader siteContent={siteContent} />
      {children}
      <FloatingCartButton />
      <CartToast />
      <AgentPanel storeName="Alicia Phone Place" />
    </CartProvider>
  );
}
