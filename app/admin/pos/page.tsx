import { api } from "@/lib/api";
import { adminContext } from "@/lib/admin-session";
import { POS } from "@/components/admin/pos";
import type { Product } from "@/lib/api/types";

export const dynamic = "force-dynamic";

export default async function AdminPOSPage() {
  const { headers, shopId } = await adminContext();
  if (!shopId) {
    return (
      <div className="mx-auto max-w-md rounded-2xl border border-[#166534]/15 bg-white p-8 text-center">
        <h2 className="text-lg font-bold text-[#0f172a]">Choose a shop to sell from</h2>
        <p className="mt-2 text-sm text-[#64748b]">
          Each shop has its own stock. Pick one in the <b>Working in</b> menu, then the till opens for that shop.
        </p>
      </div>
    );
  }
  // No demo fallback here: a till must only ever sell real, in-shop products.
  let products: Product[] = [];
  try {
    products = await api.products.list({ status: "active", channel: "pos" }, headers);
  } catch {}
  return <POS initialProducts={products} />;
}
