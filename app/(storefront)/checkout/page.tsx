import { Checkout } from "@/components/checkout";
import { getSiteContent } from "@/lib/site-content";

export const dynamic = "force-dynamic";

export default async function CheckoutPage() {
  // Rates are editable under Admin -> Shipping; fall back to the built-in table.
  const { deliveryTiers } = await getSiteContent();
  return (
    <main className="min-h-screen">
      <Checkout tiers={deliveryTiers} />
    </main>
  );
}
