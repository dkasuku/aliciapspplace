"use client";

import { useState, useTransition, useRef, useMemo } from "react";
import { Plus, Search, Smartphone, Pencil, Trash2, X, Upload, Phone, Mail, CreditCard, Calendar, Clock, Banknote } from "lucide-react";
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
import type { Product, RentalRecord, RentalPayment } from "@/lib/api/types";

const money = (v: number) => `KES ${Number(v || 0).toLocaleString()}`;

const RENTAL_STATUSES = ["pending", "approved", "active", "completed", "defaulted", "rejected"];

const PAYMENT_METHODS = ["Cash", "M-Pesa", "Bank Transfer", "Card", "Other"];

const LOAN_COMPANIES = [
  "M-Kopa",
  "Lipa Later",
  "Fuliza",
  "Tala",
  "Branch",
  "Internal (Store)",
  "Other",
];

export function RentalsManager({ initialRentals, products }: { initialRentals: RentalRecord[]; products: Product[] }) {
  const [rentals, setRentals] = useState<RentalRecord[]>(initialRentals);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [dialogOpen, setDialogOpen] = useState(false);
  const [detailOpen, setDetailOpen] = useState(false);
  const [detailRecord, setDetailRecord] = useState<RentalRecord | null>(null);
  const [editing, setEditing] = useState<RentalRecord | null>(null);
  const [pending, startTransition] = useTransition();
  const [paymentDialogOpen, setPaymentDialogOpen] = useState(false);
  const [paymentForRental, setPaymentForRental] = useState<RentalRecord | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const rentalProducts = useMemo(() => products.filter((p) => p.product_type === "rental"), [products]);

  const filtered = rentals.filter((r) => {
    const matchesSearch =
      r.customer_name.toLowerCase().includes(search.toLowerCase()) ||
      r.customer_phone.toLowerCase().includes(search.toLowerCase()) ||
      r.product_name.toLowerCase().includes(search.toLowerCase()) ||
      r.id_number.toLowerCase().includes(search.toLowerCase());
    const matchesStatus = statusFilter === "all" || r.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  const emptyForm = {
    product_id: "",
    product_name: "",
    product_type: "phone",
    customer_name: "",
    customer_phone: "",
    customer_email: "",
    id_number: "",
    id_image: "",
    total_amount: "",
    amount_paid: "0",
    daily_payment: "",
    payment_duration_days: "",
    start_date: new Date().toISOString().split("T")[0],
    loan_company: LOAN_COMPANIES[0],
    status: "pending",
    notes: "",
  };

  const [form, setForm] = useState(emptyForm);

  const emptyPayment = { amount: "", date: new Date().toISOString().split("T")[0], method: PAYMENT_METHODS[0], reference: "", notes: "" };
  const [paymentForm, setPaymentForm] = useState(emptyPayment);

  function openCreate() {
    setEditing(null);
    setForm(emptyForm);
    setDialogOpen(true);
  }

  function openEdit(record: RentalRecord) {
    setEditing(record);
    setForm({
      product_id: record.product_id,
      product_name: record.product_name,
      product_type: record.product_type,
      customer_name: record.customer_name,
      customer_phone: record.customer_phone,
      customer_email: record.customer_email || "",
      id_number: record.id_number,
      id_image: record.id_image || "",
      total_amount: String(record.total_amount),
      amount_paid: String(record.amount_paid),
      daily_payment: String(record.daily_payment),
      payment_duration_days: String(record.payment_duration_days),
      start_date: record.start_date.split("T")[0],
      loan_company: record.loan_company || LOAN_COMPANIES[0],
      status: record.status,
      notes: record.notes || "",
    });
    setDialogOpen(true);
  }

  function onProductSelect(productId: string) {
    const product = rentalProducts.find((p) => p.id === productId);
    if (product) {
      const totalAmount = product.sales_price || product.price;
      setForm((prev) => ({
        ...prev,
        product_id: product.id,
        product_name: product.name,
        total_amount: String(totalAmount),
      }));
    }
  }

  function computeEndDate(startDate: string, durationDays: number): string {
    const d = new Date(startDate);
    d.setDate(d.getDate() + durationDays);
    return d.toISOString();
  }

  function computeDailyPayment(total: number, durationDays: number): number {
    if (!durationDays) return 0;
    return Math.ceil(total / durationDays);
  }

  function save() {
    const totalAmount = parseFloat(form.total_amount) || 0;
    const amountPaid = parseFloat(form.amount_paid) || 0;
    const durationDays = parseInt(form.payment_duration_days) || 0;
    const dailyPayment = parseFloat(form.daily_payment) || computeDailyPayment(totalAmount, durationDays);

    const payload: RentalRecord = {
      id: editing?.id || `rental-${Date.now()}`,
      product_id: form.product_id,
      product_name: form.product_name,
      product_type: form.product_type,
      customer_name: form.customer_name,
      customer_phone: form.customer_phone,
      customer_email: form.customer_email || undefined,
      id_number: form.id_number,
      id_image: form.id_image || undefined,
      total_amount: totalAmount,
      amount_paid: amountPaid,
      remaining_balance: totalAmount - amountPaid,
      daily_payment: dailyPayment,
      payment_duration_days: durationDays,
      start_date: new Date(form.start_date).toISOString(),
      expected_end_date: computeEndDate(form.start_date, durationDays),
      loan_company: form.loan_company,
      status: form.status,
      payments: editing?.payments || (amountPaid > 0 ? [{ id: `pay-${Date.now()}`, amount: amountPaid, date: new Date().toISOString(), method: "Cash", notes: "Initial payment" }] : []),
      notes: form.notes || undefined,
      created_at: editing?.created_at || new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };

    startTransition(async () => {
      if (editing) {
        setRentals((prev) => prev.map((r) => (r.id === editing.id ? payload : r)));
      } else {
        setRentals((prev) => [payload, ...prev]);
      }
      setDialogOpen(false);
    });
  }

  function remove(id: string) {
    if (!confirm("Delete this rental record?")) return;
    setRentals((prev) => prev.filter((r) => r.id !== id));
  }

  function updateStatus(id: string, status: string) {
    setRentals((prev) => prev.map((r) => (r.id === id ? { ...r, status, updated_at: new Date().toISOString() } : r)));
  }

  function openPaymentDialog(record: RentalRecord) {
    setPaymentForRental(record);
    setPaymentForm(emptyPayment);
    setPaymentDialogOpen(true);
  }

  function addPayment() {
    if (!paymentForRental) return;
    const amount = parseFloat(paymentForm.amount) || 0;
    if (amount <= 0) return;

    const newPayment: RentalPayment = {
      id: `pay-${Date.now()}`,
      amount,
      date: new Date(paymentForm.date).toISOString(),
      method: paymentForm.method,
      reference: paymentForm.reference || undefined,
      notes: paymentForm.notes || undefined,
    };

    setRentals((prev) =>
      prev.map((r) => {
        if (r.id !== paymentForRental.id) return r;
        const updatedPayments = [...r.payments, newPayment];
        const newAmountPaid = updatedPayments.reduce((sum, p) => sum + p.amount, 0);
        return {
          ...r,
          payments: updatedPayments,
          amount_paid: newAmountPaid,
          remaining_balance: r.total_amount - newAmountPaid,
          status: newAmountPaid >= r.total_amount ? "completed" : r.status,
          updated_at: new Date().toISOString(),
        };
      })
    );
    setPaymentDialogOpen(false);
    setPaymentForRental(null);
  }

  function handleIdImageUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const files = e.target.files;
    if (!files || !files[0]) return;
    const file = files[0];
    if (file.size > 2 * 1024 * 1024) {
      alert("Image too large. Max 2MB.");
      return;
    }
    const reader = new FileReader();
    reader.onload = () => {
      setForm((prev) => ({ ...prev, id_image: reader.result as string }));
    };
    reader.readAsDataURL(file);
    if (fileInputRef.current) fileInputRef.current.value = "";
  }

  const statusVariant = (status: string): "default" | "secondary" | "destructive" | "warning" => {
    if (status === "completed") return "default";
    if (status === "rejected" || status === "defaulted") return "destructive";
    if (status === "active" || status === "approved") return "secondary";
    return "warning";
  };

  const totalOutstanding = rentals.reduce((sum, r) => sum + r.remaining_balance, 0);
  const totalCollected = rentals.reduce((sum, r) => sum + r.amount_paid, 0);
  const activeCount = rentals.filter((r) => r.status === "active").length;
  const pendingCount = rentals.filter((r) => r.status === "pending").length;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-[#0f172a]">Lipa Pole Pole — Rental Management</h2>
          <p className="text-sm text-[#64748b]">{rentals.length} rental records · {activeCount} active · {pendingCount} pending · {money(totalCollected)} collected · {money(totalOutstanding)} outstanding</p>
        </div>
        <Button onClick={openCreate}>
          <Plus className="mr-2 h-4 w-4" /> New rental
        </Button>
      </div>

      <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
        <div className="relative flex-1 max-w-sm">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-[#94a3b8]" />
          <Input
            placeholder="Search by customer, phone, product or ID..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-10"
          />
        </div>
        <select
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
          className="rounded-md border border-[#166534]/30 bg-white px-3 py-2 text-sm"
        >
          <option value="all">All statuses</option>
          {RENTAL_STATUSES.map((s) => (
            <option key={s} value={s}>{s}</option>
          ))}
        </select>
      </div>

      <Card>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Customer</TableHead>
                <TableHead>Product</TableHead>
                <TableHead>Total</TableHead>
                <TableHead>Paid</TableHead>
                <TableHead>Remaining</TableHead>
                <TableHead>Daily Pay</TableHead>
                <TableHead>Duration</TableHead>
                <TableHead>Loan Co.</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filtered.map((r) => (
                <TableRow key={r.id} className="cursor-pointer hover:bg-[#f0fdf4]" onClick={() => { setDetailRecord(r); setDetailOpen(true); }}>
                  <TableCell>
                    <div>
                      <p className="font-medium text-sm">{r.customer_name}</p>
                      <p className="text-[10px] text-[#94a3b8]">{r.customer_phone}</p>
                    </div>
                  </TableCell>
                  <TableCell className="text-sm">{r.product_name}</TableCell>
                  <TableCell className="text-sm font-medium">{money(r.total_amount)}</TableCell>
                  <TableCell className="text-sm font-medium text-[#166534]">{money(r.amount_paid)}</TableCell>
                  <TableCell className="text-sm font-medium text-red-600">{money(r.remaining_balance)}</TableCell>
                  <TableCell className="text-sm">{money(r.daily_payment)}</TableCell>
                  <TableCell className="text-xs text-[#64748b]">{r.payment_duration_days} days</TableCell>
                  <TableCell className="text-xs text-[#64748b]">{r.loan_company || "—"}</TableCell>
                  <TableCell>
                    <select
                      value={r.status}
                      onChange={(e) => { e.stopPropagation(); updateStatus(r.id, e.target.value); }}
                      className="rounded-md border border-[#166534]/20 bg-white px-2 py-1 text-xs font-medium"
                    >
                      {RENTAL_STATUSES.map((s) => (
                        <option key={s} value={s}>{s}</option>
                      ))}
                    </select>
                  </TableCell>
                  <TableCell className="text-right" onClick={(e) => e.stopPropagation()}>
                    <Button variant="ghost" size="icon" onClick={() => openPaymentDialog(r)} title="Record payment">
                      <Banknote className="h-4 w-4 text-[#166534]" />
                    </Button>
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
                  <TableCell colSpan={10} className="text-center text-[#64748b] py-12">
                    <Smartphone className="mx-auto mb-2 h-8 w-8 text-[#cbd5e1]" />
                    No rental records yet. Click "New rental" to create one.
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {/* Create / Edit Dialog */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{editing ? "Edit rental" : "New Lipa Pole Pole rental"}</DialogTitle>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid gap-2">
              <Label htmlFor="product">Rental product *</Label>
              <select
                id="product"
                value={form.product_id}
                onChange={(e) => onProductSelect(e.target.value)}
                className="flex h-10 w-full rounded-md border border-[#166534]/30 bg-white px-3 py-2 text-sm"
              >
                <option value="">Select a rental product…</option>
                {rentalProducts.map((p) => (
                  <option key={p.id} value={p.id}>{p.name} — {money(p.sales_price || p.price)}</option>
                ))}
                {!rentalProducts.length && products.map((p) => (
                  <option key={p.id} value={p.id}>{p.name} — {money(p.sales_price || p.price)}</option>
                ))}
              </select>
            </div>

            <div className="rounded-lg border border-[#fbbf24]/30 bg-[#fffbeb] p-3">
              <p className="text-[10px] font-bold uppercase tracking-wider text-[#92400e]">Customer Information</p>
              <div className="mt-3 grid grid-cols-1 gap-3 sm:grid-cols-2">
                <div className="grid gap-2">
                  <Label htmlFor="cust-name">Customer name *</Label>
                  <Input id="cust-name" value={form.customer_name} onChange={(e) => setForm({ ...form, customer_name: e.target.value })} placeholder="Full name" />
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="cust-phone">Phone number *</Label>
                  <Input id="cust-phone" value={form.customer_phone} onChange={(e) => setForm({ ...form, customer_phone: e.target.value })} placeholder="+254 7xx xxx xxx" />
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="cust-email">Email (optional)</Label>
                  <Input id="cust-email" type="email" value={form.customer_email} onChange={(e) => setForm({ ...form, customer_email: e.target.value })} placeholder="customer@email.com" />
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="id-number">ID number *</Label>
                  <Input id="id-number" value={form.id_number} onChange={(e) => setForm({ ...form, id_number: e.target.value })} placeholder="National ID number" />
                </div>
              </div>
              <div className="mt-3 grid gap-2">
                <Label htmlFor="id-image">ID image upload (optional)</Label>
                <div className="flex items-center gap-3">
                  {form.id_image && (
                    <div className="relative h-20 w-20 overflow-hidden rounded-lg border border-[#166534]/20 bg-white">
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img src={form.id_image} alt="ID" className="h-full w-full object-contain" />
                      <button type="button" onClick={() => setForm({ ...form, id_image: "" })} className="absolute right-1 top-1 rounded-full bg-red-500 p-1 text-white hover:bg-red-600">
                        <X className="h-3 w-3" />
                      </button>
                    </div>
                  )}
                  <button
                    type="button"
                    onClick={() => fileInputRef.current?.click()}
                    className="flex h-20 flex-col items-center justify-center gap-1 rounded-lg border-2 border-dashed border-[#166534]/30 px-6 text-[#64748b] hover:border-[#166534] hover:bg-[#f0fdf4]"
                  >
                    <Upload className="h-5 w-5" />
                    <span className="text-[10px] font-medium">Upload ID</span>
                  </button>
                  <input ref={fileInputRef} type="file" accept="image/*" onChange={handleIdImageUpload} className="hidden" />
                </div>
              </div>
            </div>

            <div className="rounded-lg border border-[#166534]/20 bg-[#f0fdf4] p-3">
              <p className="text-[10px] font-bold uppercase tracking-wider text-[#166534]">Payment Plan</p>
              <div className="mt-3 grid grid-cols-2 gap-3 sm:grid-cols-3">
                <div className="grid gap-2">
                  <Label htmlFor="total">Total amount (KES) *</Label>
                  <Input id="total" type="number" value={form.total_amount} onChange={(e) => setForm({ ...form, total_amount: e.target.value })} />
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="paid">Amount paid (KES)</Label>
                  <Input id="paid" type="number" value={form.amount_paid} onChange={(e) => setForm({ ...form, amount_paid: e.target.value })} />
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="daily">Daily payment (KES)</Label>
                  <Input id="daily" type="number" value={form.daily_payment} onChange={(e) => setForm({ ...form, daily_payment: e.target.value })} placeholder="Auto-calc if empty" />
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="duration">Duration (days) *</Label>
                  <Input id="duration" type="number" value={form.payment_duration_days} onChange={(e) => setForm({ ...form, payment_duration_days: e.target.value })} placeholder="e.g. 365" />
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="start-date">Start date *</Label>
                  <Input id="start-date" type="date" value={form.start_date} onChange={(e) => setForm({ ...form, start_date: e.target.value })} />
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="loan-co">Loan company</Label>
                  <select
                    id="loan-co"
                    value={form.loan_company}
                    onChange={(e) => setForm({ ...form, loan_company: e.target.value })}
                    className="flex h-10 w-full rounded-md border border-[#166534]/30 bg-white px-3 py-2 text-sm"
                  >
                    {LOAN_COMPANIES.map((c) => (
                      <option key={c} value={c}>{c}</option>
                    ))}
                  </select>
                </div>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="grid gap-2">
                <Label htmlFor="p-type">Product type</Label>
                <Input id="p-type" value={form.product_type} onChange={(e) => setForm({ ...form, product_type: e.target.value })} placeholder="phone, tablet, etc." />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="r-status">Status</Label>
                <select
                  id="r-status"
                  value={form.status}
                  onChange={(e) => setForm({ ...form, status: e.target.value })}
                  className="flex h-10 w-full rounded-md border border-[#166534]/30 bg-white px-3 py-2 text-sm"
                >
                  {RENTAL_STATUSES.map((s) => (
                    <option key={s} value={s}>{s}</option>
                  ))}
                </select>
              </div>
            </div>

            <div className="grid gap-2">
              <Label htmlFor="r-notes">Notes</Label>
              <Textarea id="r-notes" value={form.notes} onChange={(e) => setForm({ ...form, notes: e.target.value })} placeholder="Additional details about the rental agreement…" />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDialogOpen(false)}>Cancel</Button>
            <Button onClick={save} disabled={pending || !form.customer_name || !form.product_id || !form.id_number}>
              {pending ? "Saving..." : editing ? "Update rental" : "Create rental"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Payment Dialog */}
      <Dialog open={paymentDialogOpen} onOpenChange={setPaymentDialogOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Record Payment — {paymentForRental?.customer_name}</DialogTitle>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            {paymentForRental && (
              <div className="rounded-lg bg-[#f0fdf4] p-3 text-sm">
                <div className="flex justify-between"><span className="text-[#64748b]">Product:</span><span className="font-medium">{paymentForRental.product_name}</span></div>
                <div className="flex justify-between"><span className="text-[#64748b]">Total:</span><span className="font-medium">{money(paymentForRental.total_amount)}</span></div>
                <div className="flex justify-between"><span className="text-[#64748b]">Paid:</span><span className="font-medium text-[#166534]">{money(paymentForRental.amount_paid)}</span></div>
                <div className="flex justify-between"><span className="text-[#64748b]">Remaining:</span><span className="font-medium text-red-600">{money(paymentForRental.remaining_balance)}</span></div>
                <div className="flex justify-between"><span className="text-[#64748b]">Daily payment:</span><span className="font-medium">{money(paymentForRental.daily_payment)}</span></div>
              </div>
            )}
            <div className="grid grid-cols-2 gap-3">
              <div className="grid gap-2">
                <Label htmlFor="pay-amount">Amount (KES) *</Label>
                <Input id="pay-amount" type="number" value={paymentForm.amount} onChange={(e) => setPaymentForm({ ...paymentForm, amount: e.target.value })} placeholder={paymentForRental ? String(paymentForRental.daily_payment) : ""} />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="pay-date">Date</Label>
                <Input id="pay-date" type="date" value={paymentForm.date} onChange={(e) => setPaymentForm({ ...paymentForm, date: e.target.value })} />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="grid gap-2">
                <Label htmlFor="pay-method">Method</Label>
                <select
                  id="pay-method"
                  value={paymentForm.method}
                  onChange={(e) => setPaymentForm({ ...paymentForm, method: e.target.value })}
                  className="flex h-10 w-full rounded-md border border-[#166534]/30 bg-white px-3 py-2 text-sm"
                >
                  {PAYMENT_METHODS.map((m) => (
                    <option key={m} value={m}>{m}</option>
                  ))}
                </select>
              </div>
              <div className="grid gap-2">
                <Label htmlFor="pay-ref">Reference (optional)</Label>
                <Input id="pay-ref" value={paymentForm.reference} onChange={(e) => setPaymentForm({ ...paymentForm, reference: e.target.value })} placeholder="M-Pesa code, receipt no." />
              </div>
            </div>
            <div className="grid gap-2">
              <Label htmlFor="pay-notes">Notes (optional)</Label>
              <Input id="pay-notes" value={paymentForm.notes} onChange={(e) => setPaymentForm({ ...paymentForm, notes: e.target.value })} placeholder="Any notes about this payment" />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setPaymentDialogOpen(false)}>Cancel</Button>
            <Button onClick={addPayment} disabled={!paymentForm.amount}>
              Record payment
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Detail Dialog */}
      <Dialog open={detailOpen} onOpenChange={setDetailOpen}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          {detailRecord && (
            <>
              <DialogHeader>
                <DialogTitle>Rental Details — {detailRecord.customer_name}</DialogTitle>
              </DialogHeader>
              <div className="grid gap-4 py-4">
                <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                  <div className="flex items-center gap-2 text-sm">
                    <Smartphone className="h-4 w-4 text-[#166534]" />
                    <div><span className="text-[#64748b]">Product: </span><span className="font-medium">{detailRecord.product_name}</span></div>
                  </div>
                  <div className="flex items-center gap-2 text-sm">
                    <CreditCard className="h-4 w-4 text-[#166534]" />
                    <div><span className="text-[#64748b]">ID number: </span><span className="font-medium">{detailRecord.id_number}</span></div>
                  </div>
                  <div className="flex items-center gap-2 text-sm">
                    <Phone className="h-4 w-4 text-[#166534]" />
                    <div><span className="text-[#64748b]">Phone: </span><span className="font-medium">{detailRecord.customer_phone}</span></div>
                  </div>
                  {detailRecord.customer_email && (
                    <div className="flex items-center gap-2 text-sm">
                      <Mail className="h-4 w-4 text-[#166534]" />
                      <div><span className="text-[#64748b]">Email: </span><span className="font-medium">{detailRecord.customer_email}</span></div>
                    </div>
                  )}
                  <div className="flex items-center gap-2 text-sm">
                    <Calendar className="h-4 w-4 text-[#166534]" />
                    <div><span className="text-[#64748b]">Start: </span><span className="font-medium">{new Date(detailRecord.start_date).toLocaleDateString()}</span></div>
                  </div>
                  <div className="flex items-center gap-2 text-sm">
                    <Clock className="h-4 w-4 text-[#166534]" />
                    <div><span className="text-[#64748b]">Duration: </span><span className="font-medium">{detailRecord.payment_duration_days} days</span></div>
                  </div>
                </div>

                {detailRecord.id_image && (
                  <div>
                    <Label>ID Image</Label>
                    <div className="mt-2 h-40 w-full overflow-hidden rounded-lg border border-[#166534]/20 bg-white">
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img src={detailRecord.id_image} alt="Customer ID" className="h-full w-full object-contain" />
                    </div>
                  </div>
                )}

                <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
                  <div className="rounded-lg bg-[#f0fdf4] p-3 text-center">
                    <p className="text-[10px] font-bold uppercase text-[#64748b]">Total</p>
                    <p className="mt-1 text-sm font-bold text-[#0f172a]">{money(detailRecord.total_amount)}</p>
                  </div>
                  <div className="rounded-lg bg-[#dcfce7] p-3 text-center">
                    <p className="text-[10px] font-bold uppercase text-[#64748b]">Paid</p>
                    <p className="mt-1 text-sm font-bold text-[#166534]">{money(detailRecord.amount_paid)}</p>
                  </div>
                  <div className="rounded-lg bg-red-50 p-3 text-center">
                    <p className="text-[10px] font-bold uppercase text-[#64748b]">Remaining</p>
                    <p className="mt-1 text-sm font-bold text-red-600">{money(detailRecord.remaining_balance)}</p>
                  </div>
                  <div className="rounded-lg bg-amber-50 p-3 text-center">
                    <p className="text-[10px] font-bold uppercase text-[#64748b]">Daily Pay</p>
                    <p className="mt-1 text-sm font-bold text-[#92400e]">{money(detailRecord.daily_payment)}</p>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div className="text-sm"><span className="text-[#64748b]">Loan company: </span><Badge variant="outline">{detailRecord.loan_company || "—"}</Badge></div>
                  <div className="text-sm"><span className="text-[#64748b]">Expected end: </span><span className="font-medium">{new Date(detailRecord.expected_end_date).toLocaleDateString()}</span></div>
                </div>

                {detailRecord.notes && (
                  <div className="rounded-lg border border-[#e2e8f0] p-3">
                    <p className="text-[10px] font-bold uppercase text-[#64748b]">Notes</p>
                    <p className="mt-1 text-sm text-[#0f172a]">{detailRecord.notes}</p>
                  </div>
                )}

                <div>
                  <div className="flex items-center justify-between">
                    <h4 className="text-xs font-bold uppercase tracking-wider text-[#0f172a]">Payment History ({detailRecord.payments.length})</h4>
                    <Button size="sm" variant="outline" onClick={() => { setDetailOpen(false); openPaymentDialog(detailRecord); }}>
                      <Plus className="mr-1 h-3 w-3" /> Add payment
                    </Button>
                  </div>
                  <div className="mt-2 space-y-2">
                    {detailRecord.payments.length === 0 ? (
                      <p className="text-center text-sm text-[#94a3b8] py-4">No payments recorded yet.</p>
                    ) : (
                      detailRecord.payments.map((p) => (
                        <div key={p.id} className="flex items-center justify-between rounded-lg border border-[#e2e8f0] p-3">
                          <div>
                            <p className="text-sm font-medium">{money(p.amount)}</p>
                            <p className="text-[10px] text-[#94a3b8]">{new Date(p.date).toLocaleDateString()} · {p.method}{p.reference ? ` · Ref: ${p.reference}` : ""}</p>
                            {p.notes && <p className="text-[10px] text-[#64748b] mt-0.5">{p.notes}</p>}
                          </div>
                          <Badge variant="secondary" className="text-[10px]">{p.method}</Badge>
                        </div>
                      ))
                    )}
                  </div>
                </div>
              </div>
            </>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
