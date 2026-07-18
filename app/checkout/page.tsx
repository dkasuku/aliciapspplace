import Link from "next/link";
import { Checkout } from "@/components/checkout";
import { shipping, store } from "@/lib/topduka";

export const dynamic = "force-dynamic";

export default async function CheckoutPage() {
  const [configuration, zones] = await Promise.all([store.configuration(), shipping.zones()]);
  return <main className="min-h-screen"><header className="border-b border-[#171811] px-5 py-5"><div className="mx-auto flex max-w-6xl items-center justify-between"><Link href="/" className="font-display text-2xl font-black">TopDuka<span className="text-[#ec4b24]">.</span></Link><span className="text-[10px] font-bold uppercase tracking-[0.2em]">Secure checkout</span></div></header><Checkout configuration={configuration} zones={zones} /></main>;
}
