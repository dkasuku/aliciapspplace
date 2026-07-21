"use client";

import { useState, useTransition } from "react";
import { Plus, Search, RotateCcw, Trash2, Pencil } from "lucide-react";
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
} from "@/components/ui/dialog";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import type { Product } from "@/lib/api/types";

const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000";
const money = (v: number) => `KES ${Number(v || 0).toLocaleString()}`;

export interface ReturnRecord {
  id: string;
  product_id: string;
  product_name: string;
  quantity: number;
  reason: string;
  condition: string;
  refund_amount: number;
  customer_name?: string;
  customer_phone?: string;
  status: string;
  created_at: string;
  notes?: string;
}

const RETURN_REASONS = [
  "Defective product",
  "Wrong product delivered",
  "Product not as described",
  "Damaged in transit",
  "Customer changed mind",
  "Compatibility issue",
  "Other",
];

const RETURN_CONDITIONS = ["Resellable", "Damaged", "Refurbishable", "Dispose"];

const RETURN_STATUSES = ["pending", "approved", "refunded", "rejected"];

export function ReturnsManager({ initialReturns, products }: { initialReturns: ReturnRecord[]; products: Product[] }) {
  const [returns, setReturns] = useState<ReturnRecord[]>(initialReturns);
  const [search, setSearch] = useState("");
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editing, setEditing] = useState<ReturnRecord | null>(null);
  const [pending, startTransition] = useTransition();

  const filtered = returns.filter(
    (r) =>
      r.product_name.toLowerCase().includes(search.toLowerCase()) ||
      r.customer_name?.toLowerCase().includes(search.toLowerCase()) ||
      r.reason.toLowerCase().includes(search.toLowerCase())
  );

  const emptyForm = {
    product_id: "",
    product_name: "",
    quantity: "1",
    reason: RETURN_REASONS[0],
    condition: RETURN_CONDITIONS[0],
    refund_amount: "",
    customer_name: "",
    customer_phone: "",
    status: "pending",
    notes: "",
  };

  const [form, setForm] = useState(emptyForm);

  function openCreate() {
    setEditing(null);
    setForm(emptyForm);
    setDialogOpen(true);
  }

  function openEdit(record: ReturnRecord) {
    setEditing(record);
    setForm({
      product_id: record.product_id,
      product_name: record.product_name,
      quantity: String(record.quantity),
      reason: record.reason,
      condition: record.condition,
      refund_amount: String(record.refund_amount),
      customer_name: record.customer_name || "",
      customer_phone: record.customer_phone || "",
      status: record.status,
      notes: record.notes || "",
    });
    setDialogOpen(true);
  }

  function onProductSelect(productId: string) {
    const product = products.find((p) => p.id === productId);
    if (product) {
      setForm((prev) => ({
        ...prev,
        product_id: product.id,
        product_name: product.name,
        refund_amount: String(product.sales_price || product.price),
      }));
    }
  }

  async function save() {
    const payload = {
      product_id: form.product_id,
      product_name: form.product_name,
      quantity: parseInt(form.quantity) || 1,
      reason: form.reason,
      condition: form.condition,
      refund_amount: parseFloat(form.refund_amount) || 0,
      customer_name: form.customer_name || undefined,
      customer_phone: form.customer_phone || undefined,
      status: form.status,
      notes: form.notes,
    };

    startTransition(async () => {
      try {
        if (editing) {
          setReturns((prev) => prev.map((r) => (r.id === editing.id ? { ...r, ...payload } : r)));
        } else {
          const newRecord: ReturnRecord = {
            id: `ret-${Date.now()}`,
            ...payload,
            created_at: new Date().toISOString(),
          };
          setReturns((prev) => [newRecord, ...prev]);
        }
        setDialogOpen(false);
      } catch {}
    });
  }

  async function remove(id: string) {
    if (!confirm("Delete this return record?")) return;
    setReturns((prev) => prev.filter((r) => r.id !== id));
  }

  function updateStatus(id: string, status: string) {
    setReturns((prev) => prev.map((r) => (r.id === id ? { ...r, status } : r)));
  }

  const statusVariant = (status: string): "default" | "secondary" | "destructive" | "warning" => {
    if (status === "refunded") return "default";
    if (status === "rejected") return "destructive";
    if (status === "approved") return "secondary";
    return "warning";
  };

  const totalRefunds = returns.filter((r) => r.status === "refunded").reduce((sum, r) => sum + r.refund_amount, 0);
  const pendingCount = returns.filter((r) => r.status === "pending").length;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-[#0f172a]">Returns</h2>
          <p className="text-sm text-[#64748b]">{returns.length} return records · {pendingCount} pending · {money(totalRefunds)} refunded</p>
        </div>
        <Button onClick={openCreate}>
          <Plus className="mr-2 h-4 w-4" /> New return
        </Button>
      </div>

      <div className="relative max-w-sm">
        <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-[#94a3b8]" />
        <Input
          placeholder="Search by product, customer or reason..."
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
                <TableHead>Product</TableHead>
                <TableHead>Qty</TableHead>
                <TableHead>Reason</TableHead>
                <TableHead>Condition</TableHead>
                <TableHead>Refund</TableHead>
                <TableHead>Customer</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filtered.map((r) => (
                <TableRow key={r.id}>
                  <TableCell className="font-medium">{r.product_name}</TableCell>
                  <TableCell>{r.quantity}</TableCell>
                  <TableCell className="text-xs text-[#64748b]">{r.reason}</TableCell>
                  <TableCell>
                    <Badge variant="outline" className="text-[10px]">{r.condition}</Badge>
                  </TableCell>
                  <TableCell>{money(r.refund_amount)}</TableCell>
                  <TableCell className="text-xs text-[#64748b]">{r.customer_name || "—"}</TableCell>
                  <TableCell>
                    <select
                      value={r.status}
                      onChange={(e) => updateStatus(r.id, e.target.value)}
                      className="rounded-md border border-[#166534]/20 bg-white px-2 py-1 text-xs font-medium"
                    >
                      {RETURN_STATUSES.map((s) => (
                        <option key={s} value={s}>{s}</option>
                      ))}
                    </select>
                  </TableCell>
                  <TableCell className="text-right">
                    <Button variant="ghost" size="icon" onClick={() => openEdit(r)}>
                      <Pencil className="h-4 w-4" />
                    </Button>
                    <Button variant="ghost" size="icon" onClick={() => remove(r.id)}>
                      <Trash2 className="h-4 w-4 text-red-600" />
                    </Button>
                  </TableCell>
                </TableRow>
              ))}
              {filtered.length === 0 && (
                <TableRow>
                  <TableCell colSpan={8} className="text-center text-[#64748b]">
                    <RotateCcw className="mx-auto mb-2 h-8 w-8 text-[#cbd5e1]" />
                    No return records yet.
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
            <DialogTitle>{editing ? "Edit return" : "New return"}</DialogTitle>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid gap-2">
              <Label htmlFor="product">Product *</Label>
              <select
                id="product"
                value={form.product_id}
                onChange={(e) => onProductSelect(e.target.value)}
                className="flex h-10 w-full rounded-md border border-[#166534]/30 bg-white px-3 py-2 text-sm"
              >
                <option value="">Select a product…</option>
                {products.map((p) => (
                  <option key={p.id} value={p.id}>{p.name}</option>
                ))}
              </select>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="grid gap-2">
                <Label htmlFor="quantity">Quantity</Label>
                <Input id="quantity" type="number" min="1" value={form.quantity} onChange={(e) => setForm({ ...form, quantity: e.target.value })} />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="refund">Refund amount (KES)</Label>
                <Input id="refund" type="number" value={form.refund_amount} onChange={(e) => setForm({ ...form, refund_amount: e.target.value })} />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="grid gap-2">
                <Label htmlFor="reason">Reason</Label>
                <select
                  id="reason"
                  value={form.reason}
                  onChange={(e) => setForm({ ...form, reason: e.target.value })}
                  className="flex h-10 w-full rounded-md border border-[#166534]/30 bg-white px-3 py-2 text-sm"
                >
                  {RETURN_REASONS.map((r) => (
                    <option key={r} value={r}>{r}</option>
                  ))}
                </select>
              </div>
              <div className="grid gap-2">
                <Label htmlFor="condition">Condition</Label>
                <select
                  id="condition"
                  value={form.condition}
                  onChange={(e) => setForm({ ...form, condition: e.target.value })}
                  className="flex h-10 w-full rounded-md border border-[#166534]/30 bg-white px-3 py-2 text-sm"
                >
                  {RETURN_CONDITIONS.map((c) => (
                    <option key={c} value={c}>{c}</option>
                  ))}
                </select>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="grid gap-2">
                <Label htmlFor="cust-name">Customer name</Label>
                <Input id="cust-name" value={form.customer_name} onChange={(e) => setForm({ ...form, customer_name: e.target.value })} />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="cust-phone">Customer phone</Label>
                <Input id="cust-phone" value={form.customer_phone} onChange={(e) => setForm({ ...form, customer_phone: e.target.value })} />
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
                {RETURN_STATUSES.map((s) => (
                  <option key={s} value={s}>{s}</option>
                ))}
              </select>
            </div>
            <div className="grid gap-2">
              <Label htmlFor="notes">Notes</Label>
              <Textarea id="notes" value={form.notes} onChange={(e) => setForm({ ...form, notes: e.target.value })} placeholder="Additional details about the return…" />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDialogOpen(false)}>Cancel</Button>
            <Button onClick={save} disabled={pending || !form.product_id}>
              {pending ? "Saving..." : editing ? "Update return" : "Create return"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
