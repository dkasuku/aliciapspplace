"use client";

import { useState, useMemo } from "react";
import { Search, ShoppingCart, Plus, Minus, X, Receipt, CheckCircle, Printer, Download, Share2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import type { Product, SaleItem } from "@/lib/api/types";

const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000";
const money = (v: number) => `KES ${Number(v || 0).toLocaleString()}`;

interface CartLine {
  product: Product;
  quantity: number;
  unit_price: number;
}

export function POS({ initialProducts }: { initialProducts: Product[] }) {
  const [products] = useState(initialProducts);
  const [search, setSearch] = useState("");
  const [cart, setCart] = useState<CartLine[]>([]);
  const [checkoutOpen, setCheckoutOpen] = useState(false);
  const [success, setSuccess] = useState(false);
  const [receiptNo, setReceiptNo] = useState("");
  const [pending, setPending] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [lastSaleData, setLastSaleData] = useState<{
    receipt_no: string;
    total: number;
    subtotal: number;
    payment_method: string;
    customer_name: string;
    customer_phone: string;
    items: { name: string; qty: number; unit_price: number; total: number }[];
    date: string;
  } | null>(null);

  const [paymentMethod, setPaymentMethod] = useState("cash");
  const [customerName, setCustomerName] = useState("");
  const [customerPhone, setCustomerPhone] = useState("");

  const filtered = useMemo(
    () =>
      products.filter(
        (p) =>
          p.name.toLowerCase().includes(search.toLowerCase()) ||
          p.sku?.toLowerCase().includes(search.toLowerCase())
      ),
    [products, search]
  );

  const subtotal = cart.reduce((sum, line) => sum + line.unit_price * line.quantity, 0);
  const total = subtotal;

  function addToCart(product: Product) {
    setCart((prev) => {
      const existing = prev.find((l) => l.product.id === product.id);
      if (existing) {
        return prev.map((l) =>
          l.product.id === product.id ? { ...l, quantity: l.quantity + 1 } : l
        );
      }
      return [...prev, { product, quantity: 1, unit_price: Number(product.sales_price || product.price) }];
    });
  }

  function updateQty(productId: string, delta: number) {
    setCart((prev) =>
      prev
        .map((l) =>
          l.product.id === productId ? { ...l, quantity: l.quantity + delta } : l
        )
        .filter((l) => l.quantity > 0)
    );
  }

  function removeLine(productId: string) {
    setCart((prev) => prev.filter((l) => l.product.id !== productId));
  }

  async function completeSale() {
    if (cart.length === 0) return;
    setPending(true);
    setError(null);
    try {
      const items: SaleItem[] = cart.map((l) => ({
        product_id: l.product.id,
        product_name: l.product.name,
        quantity: l.quantity,
        unit_price: l.unit_price,
        total: l.unit_price * l.quantity,
      }));
      const body = {
        items,
        payment_method: paymentMethod,
        customer_name: customerName || undefined,
        customer_phone: customerPhone || undefined,
      };

      let saleResult: { receipt_no: string; total?: number; created_at?: string } | null = null;

      try {
        const res = await fetch(`${API_URL}/api/sales`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(body),
        });
        if (res.ok) {
          saleResult = await res.json();
        }
      } catch {
        // API unreachable — fall through to local receipt
      }

      if (!saleResult) {
        const now = new Date();
        const stamp = now.getTime().toString().slice(-6);
        saleResult = {
          receipt_no: `RCP-${now.getFullYear()}-${stamp}`,
          total: total,
          created_at: now.toISOString(),
        };
      }

      setLastSaleData({
        receipt_no: saleResult.receipt_no,
        total: total,
        subtotal,
        payment_method: paymentMethod,
        customer_name: customerName || "Walk-in customer",
        customer_phone: customerPhone || "",
        items: cart.map((l) => ({ name: l.product.name, qty: l.quantity, unit_price: l.unit_price, total: l.unit_price * l.quantity })),
        date: saleResult.created_at || new Date().toISOString(),
      });
      setReceiptNo(saleResult.receipt_no);
      setSuccess(true);
      setCart([]);
      setCustomerName("");
      setCustomerPhone("");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Sale failed");
    } finally {
      setPending(false);
    }
  }

  function printReceipt() {
    if (!lastSaleData) return;
    const d = new Date(lastSaleData.date);
    const dateStr = d.toLocaleDateString("en-KE", { year: "numeric", month: "short", day: "numeric" });
    const timeStr = d.toLocaleTimeString("en-KE", { hour: "2-digit", minute: "2-digit" });
    const itemsHtml = lastSaleData.items.map((item) => `
      <tr>
        <td style="padding:4px 0;font-size:12px;color:#333;">${item.name}<br/><span style="color:#888;font-size:10px;">${item.qty} × KES ${item.unit_price.toLocaleString()}</span></td>
        <td style="padding:4px 0;font-size:12px;text-align:right;font-weight:600;color:#333;">KES ${item.total.toLocaleString()}</td>
      </tr>
    `).join("");

    const html = `<!DOCTYPE html><html><head><title>Receipt ${lastSaleData.receipt_no}</title><style>
      *{margin:0;padding:0;box-sizing:border-box}
      body{font-family:'Courier New',monospace;background:#f5f5f5;padding:20px;display:flex;justify-content:center}
      .receipt{width:320px;background:#fff;padding:24px 20px;border-radius:8px;box-shadow:0 2px 8px rgba(0,0,0,0.1)}
      .logo{text-align:center;margin-bottom:12px}
      .logo img{height:60px;object-fit:contain}
      .logo h1{font-size:16px;font-weight:800;color:#147243;margin-top:6px;letter-spacing:-0.5px}
      .logo p{font-size:10px;color:#666;margin-top:2px}
      .divider{border-top:1px dashed #ccc;margin:12px 0}
      .meta{font-size:11px;color:#444;line-height:1.6}
      .meta div{display:flex;justify-content:space-between}
      .meta div span:last-child{font-weight:600}
      table{width:100%;border-collapse:collapse}
      .totals{margin-top:8px;font-size:12px}
      .totals div{display:flex;justify-content:space-between;padding:3px 0;color:#444}
      .grand{border-top:2px solid #147243;margin-top:6px;padding-top:6px;font-size:16px;font-weight:800;color:#147243}
      .footer{text-align:center;margin-top:16px;font-size:10px;color:#888}
      .footer strong{color:#147243}
    </style></head><body>
      <div class="receipt">
        <div class="logo">
          <img src="/Phoneplacelg.png" alt="Alicia Phone Place" onerror="this.style.display='none'"/>
          <h1>ALICIA PHONE PLACE</h1>
          <p>Juja Town, Kenya · +254 724 126 009</p>
          <p>aliciaphoneplaceke@gmail.com</p>
        </div>
        <div class="divider"></div>
        <div class="meta">
          <div><span>Receipt No:</span><span>${lastSaleData.receipt_no}</span></div>
          <div><span>Date:</span><span>${dateStr} ${timeStr}</span></div>
          <div><span>Customer:</span><span>${lastSaleData.customer_name}</span></div>
          ${lastSaleData.customer_phone ? `<div><span>Phone:</span><span>${lastSaleData.customer_phone}</span></div>` : ""}
          <div><span>Payment:</span><span style="text-transform:uppercase">${lastSaleData.payment_method}</span></div>
        </div>
        <div class="divider"></div>
        <table><tbody>${itemsHtml}</tbody></table>
        <div class="divider"></div>
        <div class="totals">
          <div><span>Subtotal</span><span>KES ${lastSaleData.subtotal.toLocaleString()}</span></div>
          <div class="grand"><span>TOTAL</span><span>KES ${lastSaleData.total.toLocaleString()}</span></div>
        </div>
        <div class="footer">
          <strong>Thank you for shopping with us!</strong><br/>
          Goods once sold are not returnable unless defective.<br/>
          Returns accepted within 7 days with receipt.<br/>
          <br/>Powered by Alicia Phone Place POS
        </div>
      </div>
      <script>window.onload=function(){window.print()}</script>
    </body></html>`;

    const w = window.open("", "_blank", "width=380,height=600");
    if (w) {
      w.document.write(html);
      w.document.close();
    }
  }

  function downloadReceipt() {
    if (!lastSaleData) return;
    const d = new Date(lastSaleData.date);
    const dateStr = d.toLocaleDateString("en-KE", { year: "numeric", month: "short", day: "numeric" });
    const timeStr = d.toLocaleTimeString("en-KE", { hour: "2-digit", minute: "2-digit" });
    const itemsHtml = lastSaleData.items.map((item) => `
      <tr>
        <td style="padding:4px 0;font-size:12px;color:#333;">${item.name}<br/><span style="color:#888;font-size:10px;">${item.qty} × KES ${item.unit_price.toLocaleString()}</span></td>
        <td style="padding:4px 0;font-size:12px;text-align:right;font-weight:600;color:#333;">KES ${item.total.toLocaleString()}</td>
      </tr>
    `).join("");

    const html = `<!DOCTYPE html><html><head><title>Receipt ${lastSaleData.receipt_no}</title><style>
      *{margin:0;padding:0;box-sizing:border-box}
      body{font-family:'Courier New',monospace;background:#f5f5f5;padding:20px;display:flex;justify-content:center}
      .receipt{width:320px;background:#fff;padding:24px 20px;border-radius:8px;box-shadow:0 2px 8px rgba(0,0,0,0.1)}
      .logo{text-align:center;margin-bottom:12px}
      .logo img{height:60px;object-fit:contain}
      .logo h1{font-size:16px;font-weight:800;color:#147243;margin-top:6px;letter-spacing:-0.5px}
      .logo p{font-size:10px;color:#666;margin-top:2px}
      .divider{border-top:1px dashed #ccc;margin:12px 0}
      .meta{font-size:11px;color:#444;line-height:1.6}
      .meta div{display:flex;justify-content:space-between}
      .meta div span:last-child{font-weight:600}
      table{width:100%;border-collapse:collapse}
      .totals{margin-top:8px;font-size:12px}
      .totals div{display:flex;justify-content:space-between;padding:3px 0;color:#444}
      .grand{border-top:2px solid #147243;margin-top:6px;padding-top:6px;font-size:16px;font-weight:800;color:#147243}
      .footer{text-align:center;margin-top:16px;font-size:10px;color:#888}
      .footer strong{color:#147243}
    </style></head><body>
      <div class="receipt">
        <div class="logo">
          <img src="/Phoneplacelg.png" alt="Alicia Phone Place" onerror="this.style.display='none'"/>
          <h1>ALICIA PHONE PLACE</h1>
          <p>Juja Town, Kenya · +254 724 126 009</p>
          <p>aliciaphoneplaceke@gmail.com</p>
        </div>
        <div class="divider"></div>
        <div class="meta">
          <div><span>Receipt No:</span><span>${lastSaleData.receipt_no}</span></div>
          <div><span>Date:</span><span>${dateStr} ${timeStr}</span></div>
          <div><span>Customer:</span><span>${lastSaleData.customer_name}</span></div>
          ${lastSaleData.customer_phone ? `<div><span>Phone:</span><span>${lastSaleData.customer_phone}</span></div>` : ""}
          <div><span>Payment:</span><span style="text-transform:uppercase">${lastSaleData.payment_method}</span></div>
        </div>
        <div class="divider"></div>
        <table><tbody>${itemsHtml}</tbody></table>
        <div class="divider"></div>
        <div class="totals">
          <div><span>Subtotal</span><span>KES ${lastSaleData.subtotal.toLocaleString()}</span></div>
          <div class="grand"><span>TOTAL</span><span>KES ${lastSaleData.total.toLocaleString()}</span></div>
        </div>
        <div class="footer">
          <strong>Thank you for shopping with us!</strong><br/>
          Goods once sold are not returnable unless defective.<br/>
          Returns accepted within 7 days with receipt.<br/>
          <br/>Powered by Alicia Phone Place POS
        </div>
      </div>
    </body></html>`;

    const blob = new Blob([html], { type: "text/html" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `Receipt-${lastSaleData.receipt_no}.html`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  }

  function shareReceipt() {
    if (!lastSaleData) return;
    const d = new Date(lastSaleData.date);
    const dateStr = d.toLocaleDateString("en-KE", { year: "numeric", month: "short", day: "numeric" });
    const timeStr = d.toLocaleTimeString("en-KE", { hour: "2-digit", minute: "2-digit" });
    const itemsText = lastSaleData.items.map((item) => `  ${item.name} (${item.qty}x) - KES ${item.total.toLocaleString()}`).join("\n");
    const text = `ALICIA PHONE PLACE\nJuja Town, Kenya · +254 724 126 009\n${"=".repeat(36)}\nReceipt: ${lastSaleData.receipt_no}\nDate: ${dateStr} ${timeStr}\nCustomer: ${lastSaleData.customer_name}${lastSaleData.customer_phone ? `\nPhone: ${lastSaleData.customer_phone}` : ""}\nPayment: ${lastSaleData.payment_method.toUpperCase()}\n${"-".repeat(36)}\n${itemsText}\n${"-".repeat(36)}\nSubtotal: KES ${lastSaleData.subtotal.toLocaleString()}\nTOTAL: KES ${lastSaleData.total.toLocaleString()}\n${"=".repeat(36)}\nThank you for shopping with us!\nReturns accepted within 7 days with receipt.`;

    if (navigator.share) {
      navigator.share({ title: `Receipt ${lastSaleData.receipt_no}`, text }).catch(() => {});
    } else {
      navigator.clipboard.writeText(text).then(() => {
        alert("Receipt copied to clipboard! You can paste it into WhatsApp, SMS, or email.");
      }).catch(() => {
        alert(text);
      });
    }
  }

  if (success) {
    return (
      <div className="flex flex-col items-center justify-center py-20">
        <CheckCircle className="h-16 w-16 text-[#166534]" />
        <h2 className="mt-4 text-2xl font-bold">Sale completed!</h2>
        <p className="mt-2 text-sm text-[#64748b]">Receipt: {receiptNo}</p>
        <p className="text-sm text-[#64748b]">Total: {money(lastSaleData?.total ?? total)}</p>
        <div className="mt-6 flex flex-wrap justify-center gap-3">
          <Button variant="outline" onClick={printReceipt}>
            <Printer className="mr-2 h-4 w-4" /> Print
          </Button>
          <Button variant="outline" onClick={downloadReceipt}>
            <Download className="mr-2 h-4 w-4" /> Download
          </Button>
          <Button variant="outline" onClick={shareReceipt}>
            <Share2 className="mr-2 h-4 w-4" /> Share
          </Button>
          <Button onClick={() => { setSuccess(false); setCheckoutOpen(false); setLastSaleData(null); }}>
            New sale
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="grid gap-4 lg:grid-cols-[1fr_340px] xl:grid-cols-[1fr_380px]">
      {/* Product grid */}
      <div className="space-y-4">
        <div>
          <h2 className="text-2xl font-bold text-[#0f172a]">Point of Sale</h2>
          <p className="text-sm text-[#64748b]">Click products to add to cart</p>
        </div>

        <div className="relative max-w-sm">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-[#94a3b8]" />
          <Input
            placeholder="Search products..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-10"
          />
        </div>

        <div className="grid grid-cols-2 gap-2 sm:grid-cols-3 sm:gap-3 lg:grid-cols-3 xl:grid-cols-4">
          {filtered.map((p) => {
            const price = Number(p.sales_price || p.price);
            const isRental = p.product_type === "rental";
            const outOfStock = p.stock === 0;
            return (
              <button
                key={p.id}
                onClick={() => addToCart(p)}
                disabled={outOfStock}
                className="group flex flex-col overflow-hidden rounded-xl border border-[#166534]/15 bg-white text-left transition hover:border-[#166534] hover:shadow-md disabled:opacity-40 disabled:cursor-not-allowed"
              >
                <div className="relative grid h-20 place-items-center overflow-hidden bg-[#f0fdf4] sm:h-24">
                  {p.images?.[0] ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img src={p.images[0]} alt={p.name} className="h-full w-full object-contain p-1" />
                  ) : (
                    <ShoppingCart className="h-7 w-7 text-[#166534]/30" />
                  )}
                  {isRental && (
                    <span className="absolute left-1 top-1 rounded-full bg-[#fbbf24] px-1.5 py-0.5 text-[7px] font-black uppercase tracking-wider text-[#78350f] sm:text-[8px]">
                      Lipa Pole Pole
                    </span>
                  )}
                </div>
                <div className="flex flex-1 flex-col gap-1.5 p-2 sm:p-2.5">
                  <p className="line-clamp-2 text-[10px] font-bold leading-tight text-[#0f172a] sm:text-[11px]">{p.name}</p>
                  <div className="mt-auto flex flex-col gap-1">
                    <span className="text-[11px] font-black text-[#166534] sm:text-xs">{money(price)}</span>
                    <div className="flex items-center justify-between">
                      <span className={`text-[9px] font-medium sm:text-[10px] ${outOfStock ? "text-red-500" : "text-[#64748b]"}`}>
                        {outOfStock ? "Out of stock" : `${p.stock} in stock`}
                      </span>
                      <span className="grid h-5 w-5 place-items-center rounded-full bg-[#dcfce7] text-[#166534] opacity-0 transition group-hover:opacity-100 sm:h-6 sm:w-6">
                        <Plus className="h-3 w-3" />
                      </span>
                    </div>
                  </div>
                </div>
              </button>
            );
          })}
          {filtered.length === 0 && (
            <p className="col-span-full py-8 text-center text-sm text-[#64748b]">No products found.</p>
          )}
        </div>
      </div>

      {/* Cart sidebar */}
      <Card className="h-fit lg:sticky lg:top-6">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <ShoppingCart className="h-5 w-5 text-[#166534]" />
            Cart ({cart.length})
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          {cart.length === 0 ? (
            <p className="py-8 text-center text-sm text-[#64748b]">Cart is empty. Click products to add.</p>
          ) : (
            cart.map((line) => (
              <div key={line.product.id} className="flex items-center gap-2 rounded-lg border border-[#166534]/10 p-2">
                <div className="flex-1">
                  <p className="text-xs font-bold leading-tight">{line.product.name}</p>
                  <p className="text-xs text-[#64748b]">{money(line.unit_price)} each</p>
                </div>
                <div className="flex items-center gap-1">
                  <Button size="icon" variant="ghost" className="h-7 w-7" onClick={() => updateQty(line.product.id, -1)}>
                    <Minus className="h-3 w-3" />
                  </Button>
                  <span className="w-8 text-center text-sm font-bold">{line.quantity}</span>
                  <Button size="icon" variant="ghost" className="h-7 w-7" onClick={() => updateQty(line.product.id, 1)}>
                    <Plus className="h-3 w-3" />
                  </Button>
                  <Button size="icon" variant="ghost" className="h-7 w-7" onClick={() => removeLine(line.product.id)}>
                    <X className="h-3 w-3 text-red-600" />
                  </Button>
                </div>
              </div>
            ))
          )}
          {cart.length > 0 && (
            <>
              <div className="border-t border-[#166534]/15 pt-3">
                <div className="flex justify-between text-sm">
                  <span className="text-[#64748b]">Subtotal</span>
                  <span className="font-bold">{money(subtotal)}</span>
                </div>
                <div className="mt-2 flex justify-between text-lg font-bold">
                  <span>Total</span>
                  <span className="text-[#166534]">{money(total)}</span>
                </div>
              </div>
              <Button className="w-full" onClick={() => setCheckoutOpen(true)}>
                <Receipt className="mr-2 h-4 w-4" /> Checkout
              </Button>
            </>
          )}
        </CardContent>
      </Card>

      {/* Checkout dialog */}
      <Dialog open={checkoutOpen} onOpenChange={setCheckoutOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Complete sale</DialogTitle>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            {error && <p className="rounded-md border border-red-200 bg-red-50 p-3 text-sm text-red-700">{error}</p>}
            <div className="grid gap-2">
              <Label htmlFor="cust-name">Customer name</Label>
              <Input id="cust-name" value={customerName} onChange={(e) => setCustomerName(e.target.value)} />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="cust-phone">Customer phone</Label>
              <Input id="cust-phone" value={customerPhone} onChange={(e) => setCustomerPhone(e.target.value)} />
            </div>
            <div className="grid gap-2">
              <Label>Payment method</Label>
              <div className="flex gap-2">
                {["cash", "mpesa", "card"].map((m) => (
                  <button
                    key={m}
                    type="button"
                    onClick={() => setPaymentMethod(m)}
                    className={`flex-1 rounded-lg border p-3 text-sm font-medium capitalize transition-colors ${
                      paymentMethod === m
                        ? "border-[#166534] bg-[#dcfce7] text-[#166534]"
                        : "border-[#166534]/20 text-[#475569] hover:bg-[#f0fdf4]"
                    }`}
                  >
                    {m}
                  </button>
                ))}
              </div>
            </div>
            <div className="rounded-lg bg-[#f0fdf4] p-4">
              <div className="flex justify-between text-sm">
                <span>Items: {cart.reduce((s, l) => s + l.quantity, 0)}</span>
                <span className="font-bold text-[#166534]">{money(total)}</span>
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setCheckoutOpen(false)}>Cancel</Button>
            <Button onClick={completeSale} disabled={pending || cart.length === 0}>
              {pending ? "Processing..." : "Complete sale"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
