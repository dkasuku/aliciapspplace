import { DiscountsManager } from "@/components/admin/discounts-manager";
import { fallbackDiscounts } from "@/lib/catalog";

export const dynamic = "force-dynamic";

export default function AdminDiscountsPage() {
  return <DiscountsManager initialDiscounts={fallbackDiscounts} />;
}
