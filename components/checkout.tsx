"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { completeCheckout, getShippingRates, startPaystackPayment, verifyPaystackPayment } from "@/app/checkout/actions";
import type { CompleteCartInput, ShippingMethod, ShippingZone, StoreConfiguration } from "@/lib/topduka";
import { useCart } from "./cart-provider";

const STORAGE = "topduka_pending_checkout";
const num = (value: unknown) => Number(value || 0);
type Payment = "cash" | "paystack";

export function Checkout({ configuration, zones }: { configuration: StoreConfiguration; zones: ShippingZone[] }) {
  const { cart, loading: cartLoading, refresh } = useCart();
  const [contact, setContact] = useState({ full_name: "", email: "", phone_number: "", address_line1: "", address_line2: "" });
  const [zoneId, setZoneId] = useState("");
  const [methodId, setMethodId] = useState("");
  const [methods, setMethods] = useState<ShippingMethod[]>([]);
  const [payment, setPayment] = useState<Payment>(configuration.cash_enabled === false ? "paystack" : "cash");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const subtotal = num(cart.subtotal || cart.total);
  const vat = configuration.vat_enabled ? subtotal * num(configuration.vat_rate) / 100 : 0;
  const zone = zones.find((item) => item.id === zoneId);
  const method = methods.find((item) => item.id === methodId);
  const delivery = method && (!method.free_over_amount || subtotal < num(method.free_over_amount)) ? num(method.price) : 0;
  const total = subtotal + vat + delivery;
  const currency = configuration.currency_code || "USD";
  const money = useMemo(() => new Intl.NumberFormat("en", { style: "currency", currency }), [currency]);
  const paystackEnabled = Boolean(configuration.paystack_enabled ?? configuration.paystack_configured);

  useEffect(() => {
    const query = new URLSearchParams(window.location.search);
    const reference = query.get("reference") || query.get("trxref");
    const pending = sessionStorage.getItem(STORAGE);
    if (!reference || !pending) return;
    void (async () => {
      try {
        const verified = await verifyPaystackPayment(reference);
        if (verified.status !== "success") throw new Error("Payment was not completed.");
        await completeCheckout({ ...(JSON.parse(pending) as CompleteCartInput), transaction_id: reference });
        sessionStorage.removeItem(STORAGE);
        setSuccess(true);
        await refresh();
        window.history.replaceState({}, "", "/checkout");
      } catch (reason) { setError(reason instanceof Error ? reason.message : "Payment verification failed."); }
      finally { setBusy(false); }
    })();
  }, [refresh]);

  async function chooseZone(id: string) {
    setZoneId(id); setMethodId(""); setMethods([]);
    const selected = zones.find((item) => item.id === id);
    if (!selected) return;
    setBusy(true); setError(null);
    try {
      const rates = await getShippingRates({ subtotal, address: { address_line1: contact.address_line1 || selected.name, city: selected.city || selected.name, state_province: selected.state_province || undefined, country: selected.country || "" } });
      setMethods(rates.methods || selected.methods || []);
    } catch (reason) {
      setMethods(selected.methods || []);
      setError(reason instanceof Error ? reason.message : "Delivery rates could not be loaded.");
    } finally { setBusy(false); }
  }

  async function submit(event: React.FormEvent) {
    event.preventDefault();
    if (!zone || !method) return setError("Choose a delivery zone and rate.");
    const payload: CompleteCartInput = { ...contact, payment_method: payment, shipping_method_id: method.id, city: zone.city || zone.name, state_province: zone.state_province || undefined, country: zone.country || "" };
    setBusy(true); setError(null);
    try {
      if (payment === "paystack") {
        sessionStorage.setItem(STORAGE, JSON.stringify(payload));
        const initialized = await startPaystackPayment(contact.email, total, `${window.location.origin}/checkout`);
        window.location.assign(initialized.authorization_url);
        return;
      }
      await completeCheckout(payload); setSuccess(true); await refresh();
    } catch (reason) { setError(reason instanceof Error ? reason.message : "The order could not be completed."); }
    finally { setBusy(false); }
  }

  if (success) return <section className="mx-auto max-w-2xl px-5 py-32 text-center"><p className="mb-4 text-xs font-bold uppercase tracking-[0.25em] text-[#ec4b24]">Order received</p><h1 className="font-display text-6xl font-black">Thank you.</h1><p className="mt-6 text-[#171811]/65">Your order is confirmed. Check your email for the receipt and updates.</p><Link href="/" className="mt-10 inline-block bg-[#171811] px-7 py-4 text-xs font-bold uppercase tracking-wider text-white">Continue shopping</Link></section>;

  return <form onSubmit={submit} className="mx-auto grid max-w-6xl lg:grid-cols-[1fr_390px]">
    <div className="border-r border-[#171811]/20 px-5 py-12 md:px-10"><p className="text-[10px] font-bold uppercase tracking-[0.22em] text-[#ec4b24]">One-page checkout</p><h1 className="mt-2 font-display text-5xl font-black tracking-tight md:text-7xl">Complete your order</h1>{error && <p className="mt-6 border border-red-700 bg-red-50 p-4 text-sm text-red-800">{error}</p>}
      <Section title="1. Contact"><div className="grid gap-4 md:grid-cols-2"><Field label="Full name" required value={contact.full_name} onChange={(value)=>setContact({...contact,full_name:value})}/><Field label="Email address" type="email" required value={contact.email} onChange={(value)=>setContact({...contact,email:value})}/><Field label="Phone number" type="tel" required value={contact.phone_number} onChange={(value)=>setContact({...contact,phone_number:value})}/></div></Section>
      <Section title="2. Delivery"><div className="grid gap-4 md:grid-cols-2"><Field label="Address / landmark" value={contact.address_line1} onChange={(value)=>setContact({...contact,address_line1:value})}/><Field label="Apartment / suite" value={contact.address_line2} onChange={(value)=>setContact({...contact,address_line2:value})}/><Select label="Delivery zone" value={zoneId} onChange={(value)=>void chooseZone(value)} options={zones.map((item)=>({value:item.id,label:item.name}))}/><Select label="Delivery rate" value={methodId} onChange={setMethodId} disabled={!methods.length} options={methods.map((item)=>({value:item.id,label:`${item.name} · ${money.format(num(item.price))}`}))}/></div></Section>
      <Section title="3. Payment"><div className="grid gap-3">{configuration.cash_enabled !== false && <Choice label="Cash on delivery" checked={payment==="cash"} onChange={()=>setPayment("cash")}/>} {paystackEnabled && <Choice label="Paystack · card or mobile money" checked={payment==="paystack"} onChange={()=>setPayment("paystack")}/>}</div></Section>
    </div>
    <aside className="bg-white px-5 py-12 md:px-8"><p className="text-[10px] font-bold uppercase tracking-[0.22em]">Order summary</p><div className="mt-6 space-y-4">{cart.items?.map((item)=><div key={item.product_id} className="flex justify-between gap-4 border-b border-[#171811]/15 pb-4"><span>{item.name || item.product_name || "Product"} × {item.quantity}</span><b>{money.format(num(item.total || num(item.price || item.unit_price)*item.quantity))}</b></div>)}</div><div className="mt-7 space-y-3 text-sm"><Row label="Subtotal" value={money.format(subtotal)}/><Row label="Delivery" value={method ? money.format(delivery) : "Select a rate"}/>{configuration.vat_enabled && <Row label={`VAT (${num(configuration.vat_rate)}%)`} value={money.format(vat)}/>}<div className="flex justify-between border-t border-[#171811] pt-5 font-display text-2xl font-black"><span>Total</span><span>{money.format(total)}</span></div></div><button disabled={busy || cartLoading || !cart.items?.length} className="mt-8 w-full bg-[#ec4b24] px-5 py-5 text-xs font-black uppercase tracking-[0.18em] disabled:opacity-40">{busy ? "Please wait…" : payment === "paystack" ? "Pay securely" : "Place order"}</button><p className="mt-4 text-center text-[10px] leading-5 text-[#171811]/55">Email and phone are required for receipt and delivery updates.</p></aside>
  </form>;
}

function Section({title,children}:{title:string;children:React.ReactNode}) { return <fieldset className="mt-10 border-t border-[#171811] pt-7"><legend className="font-display text-2xl font-bold">{title}</legend><div className="mt-5">{children}</div></fieldset>; }
function Field({label,value,onChange,type="text",required=false}:{label:string;value:string;onChange:(value:string)=>void;type?:string;required?:boolean}) { return <label className="text-xs font-bold uppercase tracking-wider">{label}{required&&" *"}<input required={required} type={type} value={value} onChange={(event)=>onChange(event.target.value)} className="mt-2 w-full border border-[#171811]/30 bg-white p-4 text-sm font-normal normal-case"/></label>; }
function Select({label,value,onChange,options,disabled=false}:{label:string;value:string;onChange:(value:string)=>void;options:{value:string;label:string}[];disabled?:boolean}) { return <label className="text-xs font-bold uppercase tracking-wider">{label} *<select required disabled={disabled} value={value} onChange={(event)=>onChange(event.target.value)} className="mt-2 w-full border border-[#171811]/30 bg-white p-4 text-sm font-normal normal-case"><option value="">Choose an option</option>{options.map((item)=><option key={item.value} value={item.value}>{item.label}</option>)}</select></label>; }
function Choice({label,checked,onChange}:{label:string;checked:boolean;onChange:()=>void}) { return <label className={`flex cursor-pointer items-center gap-4 border p-4 ${checked?"border-[#171811] bg-[#d9ff43]":"border-[#171811]/20 bg-white"}`}><input type="radio" checked={checked} onChange={onChange}/><b>{label}</b></label>; }
function Row({label,value}:{label:string;value:string}) { return <div className="flex justify-between"><span className="text-[#171811]/60">{label}</span><b>{value}</b></div>; }
