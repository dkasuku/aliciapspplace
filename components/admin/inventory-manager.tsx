"use client";

import { useState, useTransition } from "react";
import { Search, Plus, Minus, PackagePlus, History } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
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
import type { InventoryItem, StockMovement } from "@/lib/api/types";

const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000";

export function InventoryManager({ initialItems }: { initialItems: InventoryItem[] }) {
  const [items, setItems] = useState(initialItems);
  const [search, setSearch] = useState("");
  const [restockItem, setRestockItem] = useState<InventoryItem | null>(null);
  const [adjustItem, setAdjustItem] = useState<InventoryItem | null>(null);
  const [historyItem, setHistoryItem] = useState<InventoryItem | null>(null);
  const [movements, setMovements] = useState<StockMovement[]>([]);
  const [pending, startTransition] = useTransition();

  const [restockQty, setRestockQty] = useState("");
  const [restockReason, setRestockReason] = useState("");
  const [adjustStock, setAdjustStock] = useState("");
  const [adjustReason, setAdjustReason] = useState("");

  const filtered = items.filter(
    (i) =>
      i.name.toLowerCase().includes(search.toLowerCase()) ||
      i.sku?.toLowerCase().includes(search.toLowerCase())
  );

  const lowStock = items.filter((i) => i.is_low);

  function openRestock(item: InventoryItem) {
    setRestockItem(item);
    setRestockQty("");
    setRestockReason("");
  }

  function openAdjust(item: InventoryItem) {
    setAdjustItem(item);
    setAdjustStock(String(item.stock));
    setAdjustReason("");
  }

  async function openHistory(item: InventoryItem) {
    setHistoryItem(item);
    setMovements([]);
    try {
      const res = await fetch(`${API_URL}/api/inventory/movements/${item.id}`);
      if (res.ok) setMovements(await res.json());
    } catch {}
  }

  async function doRestock() {
    if (!restockItem) return;
    const qty = parseInt(restockQty) || 0;
    if (qty <= 0) return;
    startTransition(async () => {
      try {
        const res = await fetch(`${API_URL}/api/inventory/restock/${restockItem.id}`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ quantity: qty, reason: restockReason || "Manual restock" }),
        });
        if (res.ok) {
          const updated = await res.json();
          setItems((prev) => prev.map((i) => (i.id === updated.id ? { ...i, stock: updated.stock, is_low: updated.stock <= i.low_stock_threshold } : i)));
          setRestockItem(null);
        }
      } catch {}
    });
  }

  async function doAdjust() {
    if (!adjustItem) return;
    const newStock = parseInt(adjustStock) || 0;
    startTransition(async () => {
      try {
        const res = await fetch(`${API_URL}/api/inventory/adjust/${adjustItem.id}`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ stock: newStock, reason: adjustReason || "Stock adjustment" }),
        });
        if (res.ok) {
          const updated = await res.json();
          setItems((prev) => prev.map((i) => (i.id === updated.id ? { ...i, stock: updated.stock, is_low: updated.stock <= i.low_stock_threshold } : i)));
          setAdjustItem(null);
        }
      } catch {}
    });
  }

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold text-[#0f172a]">Inventory</h2>
        <p className="text-sm text-[#64748b]">
          {items.length} items · {lowStock.length} low stock alerts
        </p>
      </div>

      {lowStock.length > 0 && (
        <Card className="border-amber-200 bg-amber-50">
          <CardContent className="flex items-center gap-3 p-4">
            <PackagePlus className="h-5 w-5 text-amber-600" />
            <p className="text-sm text-amber-800">
              <b>{lowStock.length}</b> products need restocking soon.
            </p>
          </CardContent>
        </Card>
      )}

      <div className="relative max-w-sm">
        <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-[#94a3b8]" />
        <Input
          placeholder="Search inventory..."
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
                <TableHead>SKU</TableHead>
                <TableHead>Stock</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Price</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filtered.map((item) => (
                <TableRow key={item.id}>
                  <TableCell className="font-medium">{item.name}</TableCell>
                  <TableCell className="text-[#64748b]">{item.sku || "—"}</TableCell>
                  <TableCell>
                    <Badge variant={item.stock === 0 ? "destructive" : item.is_low ? "warning" : "secondary"}>
                      {item.stock}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    <Badge variant={item.status === "active" ? "default" : "outline"}>
                      {item.status}
                    </Badge>
                  </TableCell>
                  <TableCell>KES {Number(item.sales_price || item.price).toLocaleString()}</TableCell>
                  <TableCell className="text-right">
                    <Button variant="ghost" size="sm" onClick={() => openRestock(item)}>
                      <Plus className="mr-1 h-3 w-3" /> Restock
                    </Button>
                    <Button variant="ghost" size="sm" onClick={() => openAdjust(item)}>
                      Adjust
                    </Button>
                    <Button variant="ghost" size="icon" onClick={() => openHistory(item)}>
                      <History className="h-4 w-4" />
                    </Button>
                  </TableCell>
                </TableRow>
              ))}
              {filtered.length === 0 && (
                <TableRow>
                  <TableCell colSpan={6} className="text-center text-[#64748b]">
                    No inventory items found.
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {/* Restock dialog */}
      <Dialog open={!!restockItem} onOpenChange={(v) => !v && setRestockItem(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Restock: {restockItem?.name}</DialogTitle>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid gap-2">
              <Label>Current stock: {restockItem?.stock}</Label>
            </div>
            <div className="grid gap-2">
              <Label htmlFor="restock-qty">Quantity to add *</Label>
              <Input id="restock-qty" type="number" value={restockQty} onChange={(e) => setRestockQty(e.target.value)} />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="restock-reason">Reason</Label>
              <Input id="restock-reason" value={restockReason} onChange={(e) => setRestockReason(e.target.value)} placeholder="e.g. New shipment arrived" />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setRestockItem(null)}>Cancel</Button>
            <Button onClick={doRestock} disabled={pending || !restockQty}>
              {pending ? "Restocking..." : "Add stock"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Adjust dialog */}
      <Dialog open={!!adjustItem} onOpenChange={(v) => !v && setAdjustItem(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Adjust stock: {adjustItem?.name}</DialogTitle>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid gap-2">
              <Label>Current stock: {adjustItem?.stock}</Label>
            </div>
            <div className="grid gap-2">
              <Label htmlFor="adjust-stock">New stock count *</Label>
              <Input id="adjust-stock" type="number" value={adjustStock} onChange={(e) => setAdjustStock(e.target.value)} />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="adjust-reason">Reason</Label>
              <Input id="adjust-reason" value={adjustReason} onChange={(e) => setAdjustReason(e.target.value)} placeholder="e.g. Stock count correction" />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setAdjustItem(null)}>Cancel</Button>
            <Button onClick={doAdjust} disabled={pending}>
              {pending ? "Adjusting..." : "Set stock"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* History dialog */}
      <Dialog open={!!historyItem} onOpenChange={(v) => !v && setHistoryItem(null)}>
        <DialogContent className="max-w-lg max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Stock history: {historyItem?.name}</DialogTitle>
          </DialogHeader>
          <div className="space-y-2 py-4">
            {movements.length === 0 ? (
              <p className="text-sm text-[#64748b]">No stock movements recorded.</p>
            ) : (
              movements.map((m) => (
                <div key={m.id} className="flex items-center justify-between rounded-lg border border-[#166534]/10 p-3">
                  <div>
                    <p className="text-sm font-medium capitalize">{m.type}</p>
                    <p className="text-xs text-[#64748b]">{m.reason}</p>
                  </div>
                  <Badge variant={m.quantity > 0 ? "secondary" : "destructive"}>
                    {m.quantity > 0 ? "+" : ""}{m.quantity}
                  </Badge>
                </div>
              ))
            )}
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
