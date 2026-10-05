"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { Building2, Copy, MapPin, Pencil, Plus, Search } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import type { Product, Shop } from "@/lib/api/types";
import { DeleteButton } from "./delete-button";

const API = "/api/admin/backend/api";

async function call<T>(path: string, init?: RequestInit): Promise<T> {
  const res = await fetch(`${API}${path}`, {
    ...init,
    headers: { "Content-Type": "application/json", ...init?.headers },
  });
  const data = await res.json().catch(() => null);
  if (!res.ok) throw new Error((data as { error?: string } | null)?.error || `Request failed (HTTP ${res.status}).`);
  return data as T;
}

const emptyForm = { name: "", location: "", phone: "" };

export function ShopsManager({ initialShops }: { initialShops: Shop[] }) {
  const router = useRouter();
  const [shops, setShops] = useState(initialShops);
  const [error, setError] = useState<string | null>(null);

  const [editing, setEditing] = useState<Shop | null>(null);
  const [formOpen, setFormOpen] = useState(false);
  const [form, setForm] = useState(emptyForm);
  const [saving, setSaving] = useState(false);

  const [copyTarget, setCopyTarget] = useState<Shop | null>(null);

  function openNew() {
    setEditing(null);
    setForm(emptyForm);
    setFormOpen(true);
  }

  function openEdit(shop: Shop) {
    setEditing(shop);
    setForm({ name: shop.name, location: shop.location || "", phone: shop.phone || "" });
    setFormOpen(true);
  }

  async function save() {
    if (!form.name.trim()) return;
    setSaving(true);
    try {
      const saved = editing
        ? await call<Shop>(`/shops/${editing.id}`, { method: "PUT", body: JSON.stringify(form) })
        : await call<Shop>("/shops", { method: "POST", body: JSON.stringify(form) });
      setShops((prev) => (editing ? prev.map((s) => (s.id === saved.id ? saved : s)) : [...prev, saved]));
      setFormOpen(false);
      setError(null);
      router.refresh();
    } catch (reason) {
      setError(reason instanceof Error ? reason.message : "Could not save the shop.");
    } finally {
      setSaving(false);
    }
  }

  async function toggleOpen(shop: Shop) {
    try {
      const saved = await call<Shop>(`/shops/${shop.id}`, {
        method: "PUT",
        body: JSON.stringify({ is_active: !shop.is_active }),
      });
      setShops((prev) => prev.map((s) => (s.id === saved.id ? saved : s)));
      router.refresh();
    } catch (reason) {
      setError(reason instanceof Error ? reason.message : "Could not update the shop.");
    }
  }

  async function remove(shop: Shop) {
    await call(`/shops/${shop.id}`, { method: "DELETE" });
    setShops((prev) => prev.filter((s) => s.id !== shop.id));
    router.refresh();
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h2 className="text-2xl font-bold text-[#0f172a]">Shops</h2>
          <p className="text-sm text-[#64748b]">
            Each shop keeps its own products, stock and sales. The main shop is the one the website sells from.
          </p>
        </div>
        <Button onClick={openNew}>
          <Plus className="mr-2 h-4 w-4" /> Add shop
        </Button>
      </div>

      {error && <div className="rounded-lg border border-red-700 bg-red-50 p-3 text-sm text-red-800">{error}</div>}

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
        {shops.map((shop) => (
          <Card key={shop.id} className={shop.is_active ? "" : "opacity-60"}>
            <CardContent className="space-y-4 p-5">
              <div className="flex items-start justify-between gap-2">
                <div className="min-w-0">
                  <p className="flex items-center gap-2 text-lg font-bold text-[#0f172a]">
                    <Building2 className="h-4 w-4 shrink-0 text-[#166534]" />
                    <span className="truncate">{shop.name}</span>
                  </p>
                  {shop.location && (
                    <p className="mt-1 flex items-center gap-1 text-xs text-[#64748b]">
                      <MapPin className="h-3 w-3" /> {shop.location}
                    </p>
                  )}
                </div>
                <div className="flex shrink-0 gap-1">
                  {shop.is_main && <Badge>Main</Badge>}
                  {!shop.is_active && <Badge variant="warning">Closed</Badge>}
                </div>
              </div>
              <p className="text-sm text-[#64748b]">
                <b className="text-[#0f172a]">{shop.product_count}</b> products
              </p>
              <div className="flex flex-wrap gap-2">
                <Button size="sm" variant="secondary" onClick={() => setCopyTarget(shop)} disabled={shops.length < 2}>
                  <Copy className="mr-1.5 h-3.5 w-3.5" /> Copy products in
                </Button>
                <Button size="sm" variant="outline" onClick={() => openEdit(shop)}>
                  <Pencil className="mr-1.5 h-3.5 w-3.5" /> Edit
                </Button>
                {!shop.is_main && (
                  <Button size="sm" variant="ghost" onClick={() => toggleOpen(shop)}>
                    {shop.is_active ? "Close" : "Reopen"}
                  </Button>
                )}
                {!shop.is_main && shop.product_count === 0 && (
                  <DeleteButton size="sm" onDelete={() => remove(shop)} label={shop.name} />
                )}
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      <Dialog open={formOpen} onOpenChange={setFormOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{editing ? `Edit ${editing.name}` : "Add a shop"}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label htmlFor="shop-name">Name *</Label>
              <Input id="shop-name" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} placeholder="e.g. Juja Branch" />
            </div>
            <div>
              <Label htmlFor="shop-location">Location</Label>
              <Input id="shop-location" value={form.location} onChange={(e) => setForm({ ...form, location: e.target.value })} placeholder="e.g. Juja Square, Shop 12" />
            </div>
            <div>
              <Label htmlFor="shop-phone">Phone</Label>
              <Input id="shop-phone" value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setFormOpen(false)}>Cancel</Button>
            <Button onClick={save} disabled={saving || !form.name.trim()}>{saving ? "Saving…" : "Save"}</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {copyTarget && (
        <CopyProductsDialog
          target={copyTarget}
          shops={shops.filter((s) => s.id !== copyTarget.id)}
          onClose={() => setCopyTarget(null)}
          onDone={(copied) => {
            setShops((prev) =>
              prev.map((s) => (s.id === copyTarget.id ? { ...s, product_count: s.product_count + copied } : s)),
            );
            router.refresh();
          }}
        />
      )}
    </div>
  );
}

/** Pick a source shop, tick all or some of its products, and copy them across. */
function CopyProductsDialog({
  target,
  shops,
  onClose,
  onDone,
}: {
  target: Shop;
  shops: Shop[];
  onClose: () => void;
  onDone: (copied: number) => void;
}) {
  const [sourceId, setSourceId] = useState("");
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(false);
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [search, setSearch] = useState("");
  const [copyStock, setCopyStock] = useState(false);
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  async function chooseSource(id: string) {
    setSourceId(id);
    setSelected(new Set());
    setProducts([]);
    setMessage(null);
    if (!id) return;
    setLoading(true);
    try {
      setProducts(await call<Product[]>(`/products?shop_id=${encodeURIComponent(id)}`));
    } catch (reason) {
      setError(reason instanceof Error ? reason.message : "Could not load products.");
    } finally {
      setLoading(false);
    }
  }

  const visible = useMemo(
    () => products.filter((p) => p.name.toLowerCase().includes(search.toLowerCase())),
    [products, search],
  );
  const allVisibleSelected = visible.length > 0 && visible.every((p) => selected.has(p.id));

  function toggle(id: string) {
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }

  function toggleAllVisible() {
    setSelected((prev) => {
      const next = new Set(prev);
      for (const p of visible) {
        if (allVisibleSelected) next.delete(p.id);
        else next.add(p.id);
      }
      return next;
    });
  }

  async function copy(all: boolean) {
    setBusy(true);
    setError(null);
    try {
      const result = await call<{ copied: number; skipped: number }>(`/shops/${target.id}/copy-products`, {
        method: "POST",
        body: JSON.stringify({
          source_shop_id: sourceId,
          all,
          product_ids: all ? [] : [...selected],
          copy_stock: copyStock,
        }),
      });
      setMessage(
        `Copied ${result.copied} product${result.copied === 1 ? "" : "s"} into ${target.name}.` +
          (result.skipped ? ` ${result.skipped} were already there and were skipped.` : ""),
      );
      setSelected(new Set());
      onDone(result.copied);
    } catch (reason) {
      setError(reason instanceof Error ? reason.message : "Copy failed.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <Dialog open onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>Copy products into {target.name}</DialogTitle>
          <DialogDescription>
            Products with the same name already in {target.name} are skipped, so it&apos;s safe to run again.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          <div>
            <Label htmlFor="copy-source">Copy from</Label>
            <select
              id="copy-source"
              value={sourceId}
              onChange={(e) => chooseSource(e.target.value)}
              className="mt-1 w-full rounded-md border border-[#166534]/30 bg-white px-3 py-2 text-sm"
            >
              <option value="">Choose a shop…</option>
              {shops.map((shop) => (
                <option key={shop.id} value={shop.id}>
                  {shop.name} ({shop.product_count} products)
                </option>
              ))}
            </select>
          </div>

          <label className="flex items-start gap-2 text-sm">
            <input type="checkbox" checked={copyStock} onChange={(e) => setCopyStock(e.target.checked)} className="mt-0.5" />
            <span>
              Also copy stock counts
              <span className="block text-xs text-[#64748b]">
                Leave off if the goods aren&apos;t physically in {target.name} yet — copies start at 0 and get restocked there.
              </span>
            </span>
          </label>

          {sourceId && (
            <div className="rounded-lg border border-[#166534]/15">
              <div className="flex items-center gap-2 border-b border-[#166534]/15 p-2">
                <input type="checkbox" checked={allVisibleSelected} onChange={toggleAllVisible} aria-label="Select all shown" />
                <div className="relative flex-1">
                  <Search className="absolute left-2 top-2.5 h-4 w-4 text-[#94a3b8]" />
                  <Input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Search products" className="pl-8" />
                </div>
                <span className="whitespace-nowrap text-xs text-[#64748b]">{selected.size} selected</span>
              </div>
              <div className="max-h-72 overflow-y-auto">
                {loading && <p className="p-4 text-sm text-[#64748b]">Loading…</p>}
                {!loading && visible.length === 0 && <p className="p-4 text-sm text-[#64748b]">No products.</p>}
                {visible.map((p) => (
                  <label key={p.id} className="flex cursor-pointer items-center gap-3 px-3 py-2 text-sm hover:bg-[#f8faf5]">
                    <input type="checkbox" checked={selected.has(p.id)} onChange={() => toggle(p.id)} />
                    <span className="flex-1 truncate">{p.name}</span>
                    <span className="text-xs text-[#64748b]">KES {Number(p.sales_price || p.price).toLocaleString()}</span>
                    <span className="w-14 text-right text-xs text-[#64748b]">{p.stock ?? 0} pcs</span>
                  </label>
                ))}
              </div>
            </div>
          )}

          {message && <div className="rounded-lg bg-[#f0fdf4] p-3 text-sm text-[#166534]">{message}</div>}
          {error && <div className="rounded-lg border border-red-700 bg-red-50 p-3 text-sm text-red-800">{error}</div>}
        </div>

        <DialogFooter className="gap-2">
          <Button variant="outline" onClick={onClose}>Done</Button>
          <Button variant="secondary" onClick={() => copy(true)} disabled={!sourceId || busy || products.length === 0}>
            Copy all {products.length || ""}
          </Button>
          <Button onClick={() => copy(false)} disabled={!sourceId || busy || selected.size === 0}>
            {busy ? "Copying…" : `Copy ${selected.size} selected`}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
