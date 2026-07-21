"use client";

import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tag, Plus, Trash2, Percent } from "lucide-react";
import { useState } from "react";
import type { Discount } from "@/lib/catalog";

export function DiscountsManager({ initialDiscounts }: { initialDiscounts: Discount[] }) {
  const [discounts, setDiscounts] = useState<Discount[]>(initialDiscounts);
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState<{ name: string; code: string; type: Discount["type"]; value: number }>({ name: "", code: "", type: "percentage", value: 0 });

  const addDiscount = () => {
    if (!form.name || !form.code) return;
    const newDiscount: Discount = {
      id: `discount-${Date.now()}`,
      name: form.name,
      code: form.code.toUpperCase(),
      type: form.type,
      value: Number(form.value),
      active: true,
      uses: 0,
      max_uses: null,
    };
    setDiscounts([...discounts, newDiscount]);
    setForm({ name: "", code: "", type: "percentage", value: 0 });
    setShowForm(false);
  };

  const removeDiscount = (id: string) => {
    setDiscounts(discounts.filter((d) => d.id !== id));
  };

  const toggleActive = (id: string) => {
    setDiscounts(discounts.map((d) => (d.id === id ? { ...d, active: !d.active } : d)));
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-[#0f172a]">Discounts</h2>
          <p className="text-sm text-[#64748b]">{discounts.length} discount codes</p>
        </div>
        <Button onClick={() => setShowForm(!showForm)}>
          <Plus className="mr-2 h-4 w-4" /> Add discount
        </Button>
      </div>

      {showForm && (
        <Card>
          <CardContent className="space-y-4 p-6">
            <div className="grid gap-4 md:grid-cols-2">
              <div>
                <Label htmlFor="name">Discount name</Label>
                <Input id="name" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} placeholder="e.g. Summer Sale" />
              </div>
              <div>
                <Label htmlFor="code">Code</Label>
                <Input id="code" value={form.code} onChange={(e) => setForm({ ...form, code: e.target.value })} placeholder="e.g. SUMMER20" />
              </div>
              <div>
                <Label htmlFor="type">Type</Label>
                <select id="type" value={form.type} onChange={(e) => setForm({ ...form, type: e.target.value as Discount["type"] })} className="mt-1 w-full rounded-md border border-input bg-background px-3 py-2 text-sm">
                  <option value="percentage">Percentage (%)</option>
                  <option value="fixed">Fixed amount (KES)</option>
                </select>
              </div>
              <div>
                <Label htmlFor="value">Value</Label>
                <Input id="value" type="number" value={form.value} onChange={(e) => setForm({ ...form, value: Number(e.target.value) })} />
              </div>
            </div>
            <div className="flex gap-2">
              <Button onClick={addDiscount}>Save discount</Button>
              <Button variant="outline" onClick={() => setShowForm(false)}>Cancel</Button>
            </div>
          </CardContent>
        </Card>
      )}

      {discounts.length === 0 && !showForm ? (
        <Card>
          <CardContent className="py-16 text-center">
            <Tag className="mx-auto h-12 w-12 text-[#cbd5e1]" />
            <p className="mt-4 text-sm text-[#64748b]">No discount codes yet.</p>
            <p className="mt-1 text-xs text-[#94a3b8]">Create discount codes to offer promotions to your customers.</p>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-3">
          {discounts.map((discount) => (
            <Card key={discount.id}>
              <CardContent className="flex items-center justify-between p-4">
                <div className="flex items-center gap-4">
                  <div className="grid h-10 w-10 place-items-center rounded-lg bg-[#dcfce7]">
                    <Percent className="h-5 w-5 text-[#166534]" />
                  </div>
                  <div>
                    <p className="font-bold text-[#0f172a]">{discount.name}</p>
                    <p className="text-xs text-[#64748b]">
                      Code: <span className="font-mono font-bold text-[#166534]">{discount.code}</span> · {discount.type === "percentage" ? `${discount.value}%` : `KES ${discount.value.toLocaleString()}`} off
                    </p>
                    <p className="text-xs text-[#94a3b8]">{discount.uses} uses{discount.max_uses ? ` / ${discount.max_uses} max` : ""}</p>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <Badge variant={discount.active ? "default" : "secondary"} onClick={() => toggleActive(discount.id)} className="cursor-pointer">
                    {discount.active ? "Active" : "Inactive"}
                  </Badge>
                  <button onClick={() => removeDiscount(discount.id)} className="text-[#94a3b8] hover:text-red-600">
                    <Trash2 className="h-4 w-4" />
                  </button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
