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
import type { Category, Product } from "@/lib/api/types";

const money = (v: number) => `KES ${Number(v || 0).toLocaleString()}`;

export function ProductsManager({
  initialProducts,
  categories,
}: {
  initialProducts: Product[];
  categories: Category[];
}) {
  const [products, setProducts] = useState(initialProducts);
  const [search, setSearch] = useState("");
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editing, setEditing] = useState<Product | null>(null);
  const [pending, startTransition] = useTransition();
  const [saveError, setSaveError] = useState<string | null>(null);

  const filtered = products.filter((p) =>
    p.name.toLowerCase().includes(search.toLowerCase()) ||
    p.sku?.toLowerCase().includes(search.toLowerCase())
  );

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
  };

  const [form, setForm] = useState(emptyForm);
  const fileInputRef = useRef<HTMLInputElement>(null);

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
      rental_terms: form.product_type === "rental" ? form.rental_terms : undefined,
    };

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
        const saved = await res.json();
        if (editing) {
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

  function handleImageUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const files = e.target.files;
    if (!files) return;
    Array.from(files).forEach((file) => {
      if (file.size > 2 * 1024 * 1024) {
        alert(`${file.name} is too large. Max 2MB per image.`);
        return;
      }
      const reader = new FileReader();
      reader.onload = () => {
        setForm((prev) => ({ ...prev, images: [...prev.images, reader.result as string] }));
      };
      reader.readAsDataURL(file);
    });
    if (fileInputRef.current) fileInputRef.current.value = "";
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

      <div className="relative max-w-sm">
        <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-[#94a3b8]" />
        <Input
          placeholder="Search by name or SKU..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="pl-10"
        />
      </div>

      <Card>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Name</TableHead>
                <TableHead>SKU</TableHead>
                <TableHead>Price</TableHead>
                <TableHead>Sale Price</TableHead>
                <TableHead>Stock</TableHead>
                <TableHead>Type</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Categories</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filtered.map((p) => (
                <TableRow key={p.id}>
                  <TableCell className="font-medium">{p.name}</TableCell>
                  <TableCell className="text-[#64748b]">{p.sku || "—"}</TableCell>
                  <TableCell>{money(p.price)}</TableCell>
                  <TableCell>{p.sales_price ? money(p.sales_price) : "—"}</TableCell>
                  <TableCell>
                    <Badge variant={p.stock === 0 ? "destructive" : (p.stock ?? 0) <= (p.low_stock_threshold ?? 5) ? "warning" : "secondary"}>
                      {p.stock ?? 0}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    <Badge variant={p.product_type === "rental" ? "default" : "outline"} className="text-[10px]">
                      {p.product_type === "rental" ? "Lipa Pole Pole" : "Sale"}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    <Badge variant={p.status === "active" ? "default" : "outline"}>
                      {p.status}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-xs text-[#64748b]">
                    {p.categories?.join(", ") || "—"}
                  </TableCell>
                  <TableCell className="text-right">
                    <Button variant="ghost" size="icon" onClick={() => openEdit(p)}>
                      <Pencil className="h-4 w-4" />
                    </Button>
                    <Button variant="ghost" size="icon" onClick={() => remove(p.id)}>
                      <Trash2 className="h-4 w-4 text-red-600" />
                    </Button>
                  </TableCell>
                </TableRow>
              ))}
              {filtered.length === 0 && (
                <TableRow>
                  <TableCell colSpan={9} className="text-center text-[#64748b]">
                    No products found.
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
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
                  <option value="sale">Sale (one-time purchase)</option>
                  <option value="rental">Lipa Pole Pole (rental / pay slowly)</option>
                </select>
              </div>
              {form.product_type === "rental" && (
                <div className="grid gap-2">
                  <Label htmlFor="rental_terms">Rental terms</Label>
                  <Input id="rental_terms" value={form.rental_terms} onChange={(e) => setForm({ ...form, rental_terms: e.target.value })} placeholder="e.g. KES 500/day for 365 days" />
                </div>
              )}
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
                  onClick={() => fileInputRef.current?.click()}
                  className="flex h-24 w-24 flex-col items-center justify-center gap-1 rounded-lg border-2 border-dashed border-[#166534]/30 text-[#64748b] hover:border-[#166534] hover:bg-[#f0fdf4]"
                >
                  <Upload className="h-5 w-5" />
                  <span className="text-[10px] font-medium">Upload</span>
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
              <p className="text-xs text-[#94a3b8]">Upload product images (max 2MB each). You can also paste image URLs below.</p>
              <div className="flex gap-2">
                <Input
                  placeholder="Paste image URL..."
                  onKeyDown={(e) => {
                    if (e.key === "Enter") {
                      e.preventDefault();
                      const value = (e.target as HTMLInputElement).value.trim();
                      if (value) {
                        setForm((prev) => ({ ...prev, images: [...prev.images, value] }));
                        (e.target as HTMLInputElement).value = "";
                      }
                    }
                  }}
                />
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
