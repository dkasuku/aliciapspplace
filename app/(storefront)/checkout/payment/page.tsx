import Link from "next/link";
import { cookies } from "next/headers";
import { LAST_ORDER_COOKIE } from "@/lib/checkout-server";
import { OrderConfirmation } from "@/components/order-confirmation";
import { ORDER_WHATSAPP_DISPLAY, type OrderSummary } from "@/lib/whatsapp";

export const dynamic = "force-dynamic";

export default async function PaymentResultPage({
  searchParams,
}: {
  searchParams: Promise<{ status?: string; reason?: string; warning?: string }>;
}) {
  const { status, reason, warning } = await searchParams;
  const raw = (await cookies()).get(LAST_ORDER_COOKIE)?.value;

  let order: OrderSummary | null = null;
  if (raw) {
    try {
      order = JSON.parse(raw) as OrderSummary;
    } catch {
      order = null;
    }
  }

  if (status === "paid" && order) {
    return (
      <main className="min-h-screen bg-[#f8faf5]">
        <OrderConfirmation order={order} warning={warning} />
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-[#f8faf5]">
      <section className="mx-auto max-w-2xl px-5 py-32 text-center">
        <p className="mb-4 text-xs font-bold uppercase tracking-[0.25em] text-red-700">Payment not completed</p>
        <h1 className="font-display text-4xl font-black text-[#0f172a] sm:text-5xl">We didn&apos;t receive it.</h1>
        <p className="mt-6 text-[#0f172a]/65">
          {reason || "The payment was cancelled or did not go through."} Your bag is still saved — try again, or pay
          on delivery instead.
        </p>
        <div className="mt-10 flex flex-col items-center justify-center gap-3 sm:flex-row">
          <Link
            href="/checkout"
            className="bg-[#166534] px-7 py-4 text-xs font-bold uppercase tracking-wider text-white shadow-md transition-colors hover:bg-[#14532d]"
          >
            Back to checkout
          </Link>
          <a
            href={`https://wa.me/254724126009`}
            target="_blank"
            rel="noopener noreferrer"
            className="border border-[#166534]/30 px-7 py-4 text-xs font-bold uppercase tracking-wider text-[#166534] transition-colors hover:bg-[#166534]/5"
          >
            WhatsApp {ORDER_WHATSAPP_DISPLAY}
          </a>
        </div>
      </section>
    </main>
  );
}
