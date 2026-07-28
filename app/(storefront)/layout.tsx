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
      {/* Reserves room for the fixed cart and chat launchers so page content —
          the checkout button especially — is never sitting underneath them. */}
      <div className="pb-24 sm:pb-28">{children}</div>
      <FloatingCartButton />
      <CartToast />
      <AgentPanel storeName="Alicia Phone Place" />
    </CartProvider>
  );
}
