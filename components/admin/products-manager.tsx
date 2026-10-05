"use client";

import { useState, useTransition, useRef } from "react";
import { Plus, Pencil, Trash2, Search, Upload, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
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
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import type { Category, Product, Shop } from "@/lib/api/types";
import { Pagination, usePagination } from "./pagination";

const money = (v: number) => `KES ${Number(v || 0).toLocaleString()}`;

export function ProductsManager({
  initialProducts,
  categories,
  canManage,
  shops,
  activeShopId,
}: {
  initialProducts: Product[];
  categories: Category[];
  shops: Shop[];
  /** The shop picked in "Working in"; null means all shops. */
  activeShopId: string | null;
  /** Attendants can add products but not edit prices or delete. */
  canManage: boolean;
}) {
  const [products, setProducts] = useState(initialProducts);
  const shopNames = new Map(shops.map((shop) => [shop.id, shop.name]));
  const [search, setSearch] = useState("");
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editing, setEditing] = useState<Product | null>(null);
  const [pending, startTransition] = useTransition();
  const [saveError, setSaveError] = useState<string | null>(null);
  const [uploading, setUploading] = useState(false);

  const [typeFilter, setTypeFilter] = useState<"all" | "sale" | "rental">("all");
  const [channelFilter, setChannelFilter] = useState<"all" | "site" | "pos" | "hidden">("all");

  const filtered = products.filter((p) => {
    const term = search.toLowerCase();
    const matchesTerm =
      !term || p.name.toLowerCase().includes(term) || (p.sku?.toLowerCase().includes(term) ?? false);
    if (!matchesTerm) return false;

    // "both" belongs to the cash list and the Lipa Pole Pole list alike.
    const type = p.product_type || "sale";
    if (typeFilter !== "all" && type !== typeFilter && type !== "both") return false;

    const onSite = p.visible_on_site !== false;
    const inPos = p.visible_in_pos !== false;
    if (channelFilter === "site" && !onSite) return false;
    if (channelFilter === "pos" && !inPos) return false;
    if (channelFilter === "hidden" && (onSite || inPos)) return false;

    return true;
  });

  const paging = usePagination(filtered, 10);

  const emptyForm = {
    name: "",
    description: "",
    price: "",
    sales_price: "",
    sku: "",
    stock: "",
    low_stock_threshold: "5",
    status: "active",
    categories: [] as string[],
    images: [] as string[],
    product_type: "sale",
    rental_terms: "",
    visible_on_site: true,
    visible_in_pos: true,
    specs: [] as Array<{ label: string; value: string }>,
    // New products default to the shop being worked in, or every open shop.
    shop_ids: activeShopId ? [activeShopId] : shops.filter((s) => s.is_active).map((s) => s.id),
    apply_to_all_shops: true,
  };

  const [form, setForm] = useState(emptyForm);
  const [imageUrl, setImageUrl] = useState("");
  const fileInputRef = useRef<HTMLInputElement>(null);

  /** Pasting a URL only worked on Enter before, with no button to press. */
  function addImageUrl() {
    const value = imageUrl.trim();
    if (!value) return;
    setForm((prev) => ({ ...prev, images: [...prev.images, value] }));
    setImageUrl("");
  }

  function openCreate() {
    setSaveError(null);
    setEditing(null);
    setForm(emptyForm);
    setDialogOpen(true);
  }

  function openEdit(product: Product) {
    setSaveError(null);
    setEditing(product);
    setForm({
      name: product.name,
      description: product.description || "",
      price: String(product.price),
      sales_price: product.sales_price ? String(product.sales_price) : "",
      sku: product.sku || "",
      stock: String(product.stock ?? 0),
      low_stock_threshold: String(product.low_stock_threshold ?? 5),
      status: product.status || "active",
      categories: product.categories || [],
      images: product.images || [],
      product_type: product.product_type || "sale",
      rental_terms: product.rental_terms || "",
      visible_on_site: product.visible_on_site !== false,
      visible_in_pos: product.visible_in_pos !== false,
      specs: product.specs || [],
      shop_ids: product.available_in?.length ? product.available_in : product.shop_id ? [product.shop_id] : [],
      apply_to_all_shops: true,
    });
    setDialogOpen(true);
  }

  async function save() {
    const payload = {
      name: form.name,
      description: form.description,
      price: parseFloat(form.price) || 0,
      sales_price: form.sales_price ? parseFloat(form.sales_price) : null,
      sku: form.sku,
      stock: parseInt(form.stock) || 0,
      low_stock_threshold: parseInt(form.low_stock_threshold) || 5,
      status: form.status,
      categories: form.categories,
      images: form.images,
      product_type: form.product_type,
      rental_terms: form.product_type === "sale" ? undefined : form.rental_terms,
      visible_on_site: form.visible_on_site,
      visible_in_pos: form.visible_in_pos,
      specs: form.specs.filter((row) => row.label.trim() && row.value.trim()),
      ...(canManage && !editing ? { shop_ids: form.shop_ids } : {}),
      ...(editing ? { apply_to_all_shops: form.apply_to_all_shops } : {}),
    };
    if (canManage && shops.length > 1 && form.shop_ids.length === 0) {
      setSaveError("Pick at least one shop for this product.");
      return;
    }

    setSaveError(null);
    startTransition(async () => {
      try {
        const url = editing
          ? `/api/admin/products/${editing.id}`
          : "/api/admin/products";
        const res = await fetch(url, {
          method: editing ? "PUT" : "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload),
        });
        if (!res.ok) {
          const data = await res.json().catch(() => null) as { error?: unknown } | null;
          throw new Error(typeof data?.error === "string" ? data.error : `The product could not be saved (HTTP ${res.status}).`);
        }
        const saved = (await res.json()) as Product;

        // Ticking or unticking shops on an existing product adds or removes those shops' copies.
        const before = [...(editing?.available_in ?? [])].sort().join();
        if (editing && canManage && shops.length > 1 && [...form.shop_ids].sort().join() !== before) {
          const shopRes = await fetch(`/api/admin/backend/api/products/${saved.id}/shops`, {
            method: "PUT",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ shop_ids: form.shop_ids }),
          });
          if (!shopRes.ok) {
            const data = (await shopRes.json().catch(() => null)) as { error?: string } | null;
            throw new Error(data?.error || "Saved, but the shop list could not be updated.");
          }
        }

        // Copies in other shops may have been added, changed or removed: reload the list.
        const listRes = await fetch("/api/admin/backend/api/products", { cache: "no-store" });
        if (listRes.ok) {
          setProducts(await listRes.json());
        } else if (editing) {
          setProducts((prev) => prev.map((p) => (p.id === saved.id ? saved : p)));
        } else {
          setProducts((prev) => [saved, ...prev]);
        }
        setDialogOpen(false);
      } catch (error) {
        setSaveError(error instanceof Error ? error.message : "The product could not be saved. Check the API connection.");
      }
    });
  }

  async function remove(id: string) {
    if (!confirm("Delete this product?")) return;
    startTransition(async () => {
      try {
        const res = await fetch(`/api/admin/products/${id}`, { method: "DELETE" });
        if (!res.ok) {
          const data = await res.json().catch(() => null) as { error?: unknown } | null;
          throw new Error(typeof data?.error === "string" ? data.error : "The product could not be deleted.");
        }
        setProducts((prev) => prev.filter((p) => p.id !== id));
      } catch {}
    });
  }

  /**
   * Uploads to object storage and stores the returned URL. Falls back to an
   * inline data URI only when storage is not configured — that path bloats the
   * database and every catalogue response, so it is a stopgap, not the plan.
   */
  async function handleImageUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const files = e.target.files;
    if (!files) return;
    const chosen = Array.from(files);
    if (fileInputRef.current) fileInputRef.current.value = "";

    setUploading(true);
    try {
      for (const file of chosen) {
        if (file.size > 10 * 1024 * 1024) {
          alert(`${file.name} is too large. Max 10MB per image.`);
          continue;
        }

        const body = new FormData();
        body.append("file", file);
        const response = await fetch("/api/admin/upload", { method: "POST", body });
        const payload = (await response.json().catch(() => null)) as { url?: string; error?: string } | null;

        if (response.ok && payload?.url) {
          setForm((prev) => ({ ...prev, images: [...prev.images, payload.url as string] }));
          continue;
        }

        if (response.status === 503) {
          if (file.size > 2 * 1024 * 1024) {
            alert(`${file.name}: image storage is not configured, so images must be under 2MB.`);
            continue;
          }
          const dataUri = await new Promise<string>((resolve) => {
            const reader = new FileReader();
            reader.onload = () => resolve(reader.result as string);
            reader.readAsDataURL(file);
          });
          setForm((prev) => ({ ...prev, images: [...prev.images, dataUri] }));
          continue;
        }

        alert(`${file.name}: ${payload?.error || "Upload failed."}`);
      }
    } finally {
      setUploading(false);
    }
  }

  function removeImage(index: number) {
    setForm((prev) => ({ ...prev, images: prev.images.filter((_, i) => i !== index) }));
  }

  function toggleCategory(name: string) {
    setForm((prev) => ({
      ...prev,
      categories: prev.categories.includes(name)
        ? prev.categories.filter((c) => c !== name)
        : [...prev.categories, name],
    }));
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-[#0f172a]">Products</h2>
          <p className="text-sm text-[#64748b]">{products.length} products in catalog</p>
        </div>
        <Button onClick={openCreate}>
          <Plus className="mr-2 h-4 w-4" /> Add product
        </Button>
      </div>

      <div className="flex flex-wrap items-center gap-3">
        <div className="relative min-w-56 max-w-sm flex-1">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-[#94a3b8]" />
          <Input
            placeholder="Search by name or SKU..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-10"
          />
        </div>

        <div className="flex flex-wrap items-center gap-1">
          <span className="mr-1 text-xs font-medium text-[#64748b]">Type</span>
          {([
            { id: "all", label: "All" },
            { id: "sale", label: "Cash" },
            { id: "rental", label: "Lipa Pole Pole" },
          ] as const).map((option) => (
            <Button
              key={option.id}
              size="sm"
              variant={typeFilter === option.id ? "default" : "outline"}
              onClick={() => setTypeFilter(option.id)}
            >
              {option.label}
            </Button>
          ))}
        </div>

        <div className="flex flex-wrap items-center gap-1">
          <span className="mr-1 text-xs font-medium text-[#64748b]">Shown in</span>
          {([
            { id: "all", label: "Any" },
            { id: "site", label: "Website" },
            { id: "pos", label: "POS" },
            { id: "hidden", label: "Hidden" },
          ] as const).map((option) => (
            <Button
              key={option.id}
              size="sm"
              variant={channelFilter === option.id ? "default" : "outline"}
              onClick={() => setChannelFilter(option.id)}
            >
              {option.label}
            </Button>
          ))}
        </div>
      </div>

      <Card>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Name</TableHead>
                <TableHead>Shops</TableHead>
                <TableHead>SKU</TableHead>
                <TableHead>Price</TableHead>
                <TableHead>Sale Price</TableHead>
                <TableHead>Stock</TableHead>
                <TableHead>Type</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Shown in</TableHead>
                <TableHead>Categories</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {paging.visible.map((p) => (
                <TableRow key={p.id}>
                  <TableCell className="font-medium">{p.name}</TableCell>
                  <TableCell>
                    <span className="flex flex-wrap gap-1">
                      {(p.available_in?.length ? p.available_in : [p.shop_id || ""]).map((id) => (
                        <Badge
                          key={id}
                          variant={id === p.shop_id ? "secondary" : "outline"}
                          className="whitespace-nowrap text-[10px]"
                        >
                          {shopNames.get(id) || "Shop 1"}
                        </Badge>
                      ))}
                    </span>
                  </TableCell>
                  <TableCell className="text-[#64748b]">{p.sku || "—"}</TableCell>
                  <TableCell>{money(p.price)}</TableCell>
                  <TableCell>{p.sales_price ? money(p.sales_price) : "—"}</TableCell>
                  <TableCell>
                    <Badge variant={p.stock === 0 ? "destructive" : (p.stock ?? 0) <= (p.low_stock_threshold ?? 5) ? "warning" : "secondary"}>
                      {p.stock ?? 0}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    <Badge variant={p.product_type === "sale" || !p.product_type ? "outline" : "default"} className="text-[10px]">
                      {p.product_type === "both" ? "Sale + LPP" : p.product_type === "rental" ? "Lipa Pole Pole" : "Sale"}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    <Badge variant={p.status === "active" ? "default" : "outline"}>
                      {p.status}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    <span className="flex flex-wrap gap-1">
                      {p.visible_on_site !== false && (
                        <Badge variant="secondary" className="text-[10px]">Website</Badge>
                      )}
                      {p.visible_in_pos !== false && (
                        <Badge variant="secondary" className="text-[10px]">POS</Badge>
                      )}
                      {p.visible_on_site === false && p.visible_in_pos === false && (
                        <Badge variant="outline" className="text-[10px] text-[#94a3b8]">Hidden</Badge>
                      )}
                    </span>
                  </TableCell>
                  <TableCell className="text-xs text-[#64748b]">
                    {p.categories?.join(", ") || "—"}
                  </TableCell>
                  <TableCell className="text-right">
                    {canManage && (
                      <>
                        <Button variant="ghost" size="icon" onClick={() => openEdit(p)}>
                          <Pencil className="h-4 w-4" />
                        </Button>
                        <Button variant="ghost" size="icon" onClick={() => remove(p.id)}>
                          <Trash2 className="h-4 w-4 text-red-600" />
                        </Button>
                      </>
                    )}
                  </TableCell>
                </TableRow>
              ))}
              {filtered.length === 0 && (
                <TableRow>
                  <TableCell colSpan={11} className="text-center text-[#64748b]">
                    No products found.
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
          <Pagination state={paging} label="products" />
        </CardContent>
      </Card>

      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{editing ? "Edit product" : "New product"}</DialogTitle>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            {saveError && <p role="alert" className="rounded-md border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">{saveError}</p>}
            <div className="grid gap-2">
              <Label htmlFor="name">Product name *</Label>
              <Input id="name" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="description">Description</Label>
              <Textarea id="description" value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="grid gap-2">
                <Label htmlFor="price">Price (KES) *</Label>
                <Input id="price" type="number" value={form.price} onChange={(e) => setForm({ ...form, price: e.target.value })} />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="sales_price">Sale price (KES)</Label>
                <Input id="sales_price" type="number" value={form.sales_price} onChange={(e) => setForm({ ...form, sales_price: e.target.value })} />
              </div>
            </div>
            <div className="grid grid-cols-3 gap-4">
              <div className="grid gap-2">
                <Label htmlFor="sku">SKU</Label>
                <Input id="sku" value={form.sku} onChange={(e) => setForm({ ...form, sku: e.target.value })} />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="stock">Stock</Label>
                <Input id="stock" type="number" value={form.stock} onChange={(e) => setForm({ ...form, stock: e.target.value })} />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="threshold">Low stock alert</Label>
                <Input id="threshold" type="number" value={form.low_stock_threshold} onChange={(e) => setForm({ ...form, low_stock_threshold: e.target.value })} />
              </div>
            </div>
            <div className="grid gap-2">
              <Label>Categories</Label>
              <div className="flex flex-wrap gap-2">
                {categories.map((cat) => (
                  <button
                    key={cat.id}
                    type="button"
                    onClick={() => toggleCategory(cat.name)}
                    className={`rounded-full px-3 py-1.5 text-xs font-medium transition-colors ${
                      form.categories.includes(cat.name)
                        ? "bg-[#166534] text-white"
                        : "border border-[#166534]/30 text-[#475569] hover:bg-[#f0fdf4]"
                    }`}
                  >
                    {cat.name}
                  </button>
                ))}
              </div>
            </div>
            <div className="grid gap-2">
              <Label htmlFor="status">Status</Label>
              <select
                id="status"
                value={form.status}
                onChange={(e) => setForm({ ...form, status: e.target.value })}
                className="flex h-10 w-full rounded-md border border-[#166534]/30 bg-white px-3 py-2 text-sm"
              >
                <option value="active">Active</option>
                <option value="draft">Draft</option>
                <option value="inactive">Inactive</option>
              </select>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="grid gap-2">
                <Label htmlFor="product_type">Product type</Label>
                <select
                  id="product_type"
                  value={form.product_type}
                  onChange={(e) => setForm({ ...form, product_type: e.target.value })}
                  className="flex h-10 w-full rounded-md border border-[#166534]/30 bg-white px-3 py-2 text-sm"
                >
                  <option value="sale">Sale only (one-time purchase)</option>
                  <option value="rental">Lipa Pole Pole only (pay slowly)</option>
                  <option value="both">Both — sale and Lipa Pole Pole</option>
                </select>
              </div>
              {(form.product_type === "rental" || form.product_type === "both") && (
                <div className="grid gap-2">
                  <Label htmlFor="rental_terms">Rental terms</Label>
                  <Input id="rental_terms" value={form.rental_terms} onChange={(e) => setForm({ ...form, rental_terms: e.target.value })} placeholder="e.g. KES 500/day for 365 days" />
                  <p className="text-xs text-[#94a3b8]">Shown on the product page under the Lipa Pole Pole badge.</p>
                </div>
              )}
            </div>

            <div className="grid gap-2">
              <Label>Key features</Label>
              <p className="text-xs text-[#94a3b8]">
                Shown as a bulleted spec list on the product page, e.g. RAM · 8GB.
              </p>
              <div className="space-y-2">
                {form.specs.map((row, index) => (
                  <div key={index} className="flex gap-2">
                    <Input
                      value={row.label}
                      placeholder="Label (e.g. RAM)"
                      className="max-w-[36%]"
                      onChange={(e) =>
                        setForm((prev) => ({
                          ...prev,
                          specs: prev.specs.map((r, i) => (i === index ? { ...r, label: e.target.value } : r)),
                        }))
                      }
                    />
                    <Input
                      value={row.value}
                      placeholder="Value (e.g. 8GB)"
                      onChange={(e) =>
                        setForm((prev) => ({
                          ...prev,
                          specs: prev.specs.map((r, i) => (i === index ? { ...r, value: e.target.value } : r)),
                        }))
                      }
                    />
                    <Button
                      type="button"
                      variant="ghost"
                      size="icon"
                      aria-label="Remove feature"
                      onClick={() => setForm((prev) => ({ ...prev, specs: prev.specs.filter((_, i) => i !== index) }))}
                    >
                      <X className="h-4 w-4 text-red-600" />
                    </Button>
                  </div>
                ))}
              </div>
              <Button
                type="button"
                variant="outline"
                size="sm"
                className="w-fit"
                onClick={() => setForm((prev) => ({ ...prev, specs: [...prev.specs, { label: "", value: "" }] }))}
              >
                <Plus className="mr-1 h-3 w-3" /> Add feature
              </Button>
            </div>

            {canManage && shops.length > 1 && (
              <div className="grid gap-2">
                <Label>Available in shops</Label>
                <div className="flex flex-wrap gap-4 rounded-lg border border-[#166534]/20 p-4">
                  {shops
                    .filter((shop) => shop.is_active || form.shop_ids.includes(shop.id))
                    .map((shop) => (
                      <label key={shop.id} className="flex items-center gap-2 text-sm text-[#334155]">
                        <input
                          type="checkbox"
                          checked={form.shop_ids.includes(shop.id)}
                          onChange={(e) =>
                            setForm((prev) => ({
                              ...prev,
                              shop_ids: e.target.checked
                                ? [...prev.shop_ids, shop.id]
                                : prev.shop_ids.filter((id) => id !== shop.id),
                            }))
                          }
                          className="h-4 w-4 accent-[#166534]"
                        />
                        {shop.name}
                      </label>
                    ))}
                </div>
                <p className="text-xs text-[#94a3b8]">
                  {editing
                    ? "Ticking a shop adds the product there with 0 stock (restock it in that shop). Unticking removes it from that shop."
                    : "The stock you enter goes into each ticked shop."}
                </p>
                {editing && (editing.available_in?.length ?? 0) > 1 && (
                  <label className="flex items-center gap-2 text-sm text-[#334155]">
                    <input
                      type="checkbox"
                      checked={form.apply_to_all_shops}
                      onChange={(e) => setForm({ ...form, apply_to_all_shops: e.target.checked })}
                      className="h-4 w-4 accent-[#166534]"
                    />
                    Apply these changes (price, name, details) to every shop. Stock stays per shop.
                  </label>
                )}
              </div>
            )}

            <div className="grid gap-2">
              <Label>Where this product appears</Label>
              <div className="flex flex-wrap gap-4 rounded-lg border border-[#166534]/20 p-4">
                <label className="flex items-center gap-2 text-sm text-[#334155]">
                  <input
                    type="checkbox"
                    checked={form.visible_on_site}
                    onChange={(e) => setForm({ ...form, visible_on_site: e.target.checked })}
                    className="h-4 w-4 accent-[#166534]"
                  />
                  Website
                </label>
                <label className="flex items-center gap-2 text-sm text-[#334155]">
                  <input
                    type="checkbox"
                    checked={form.visible_in_pos}
                    onChange={(e) => setForm({ ...form, visible_in_pos: e.target.checked })}
                    className="h-4 w-4 accent-[#166534]"
                  />
                  POS / in-shop till
                </label>
              </div>
              <p className="text-xs text-[#94a3b8]">
                {!form.visible_on_site && !form.visible_in_pos
                  ? "Hidden everywhere — the product stays in your records but customers and the till will not see it."
                  : "Untick a channel to hide this product there without deleting it."}
              </p>
            </div>
            <div className="grid gap-2">
              <Label>Product images</Label>
              <div className="flex flex-wrap gap-3">
                {form.images.map((img, index) => (
                  <div key={index} className="relative h-24 w-24 overflow-hidden rounded-lg border border-[#166534]/20 bg-white">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img src={img} alt={`Product ${index + 1}`} className="h-full w-full object-contain" />
                    <button
                      type="button"
                      onClick={() => removeImage(index)}
                      className="absolute right-1 top-1 rounded-full bg-red-500 p-1 text-white hover:bg-red-600"
                      aria-label="Remove image"
                    >
                      <X className="h-3 w-3" />
                    </button>
                  </div>
                ))}
                <button
                  type="button"
                  disabled={uploading}
                  onClick={() => fileInputRef.current?.click()}
                  className="flex h-24 w-24 flex-col items-center justify-center gap-1 rounded-lg border-2 border-dashed border-[#166534]/30 text-[#64748b] hover:border-[#166534] hover:bg-[#f0fdf4] disabled:opacity-50"
                >
                  <Upload className="h-5 w-5" />
                  <span className="text-[10px] font-medium">{uploading ? "Uploading…" : "Upload"}</span>
                </button>
              </div>
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                multiple
                onChange={handleImageUpload}
                className="hidden"
              />
              <p className="text-xs text-[#94a3b8]">Upload product images (max 10MB each — resized and stored automatically). You can also paste image URLs below.</p>
              <div className="flex gap-2">
                <Input
                  placeholder="Paste image URL..."
                  value={imageUrl}
                  onChange={(e) => setImageUrl(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter") {
                      e.preventDefault();
                      addImageUrl();
                    }
                  }}
                />
                <Button type="button" variant="outline" onClick={addImageUrl} disabled={!imageUrl.trim()}>
                  <Plus className="mr-1 h-3 w-3" /> Add
                </Button>
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDialogOpen(false)}>Cancel</Button>
            <Button onClick={save} disabled={pending || !form.name}>
              {pending ? "Saving..." : editing ? "Update product" : "Create product"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
