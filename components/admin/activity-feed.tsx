"use client";

import { useMemo, useState } from "react";
import {
  AlertTriangle,
  Boxes,
  CheckCheck,
  LogIn,
  Package,
  RefreshCw,
  ShoppingCart,
  Trash2,
  UserCog,
  type LucideIcon,
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { cn } from "@/lib/utils";
import type { ActivityEntry, Shop, StaffSummary, StaffUser } from "@/lib/api/types";
import { Pagination, usePagination } from "./pagination";

const ICONS: Record<string, LucideIcon> = {
  sale: ShoppingCart,
  sale_deleted: Trash2,
  restock: Boxes,
  stock_adjusted: Boxes,
  product_added: Package,
  product_edited: Package,
  product_deleted: Trash2,
  login: LogIn,
  login_failed: AlertTriangle,
};

const money = (v: number) => `KES ${Number(v || 0).toLocaleString()}`;

function when(iso: string) {
  const date = new Date(iso.endsWith("Z") || iso.includes("+") ? iso : `${iso}Z`);
  const today = new Date().toDateString() === date.toDateString();
  return today
    ? date.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })
    : date.toLocaleString([], { day: "numeric", month: "short", hour: "2-digit", minute: "2-digit" });
}

export function ActivityFeed({
  initialEntries,
  shops,
  users,
  summary,
}: {
  initialEntries: ActivityEntry[];
  shops: Shop[];
  users: StaffUser[];
  summary: StaffSummary[];
}) {
  const [entries, setEntries] = useState(initialEntries);
  const [person, setPerson] = useState("");
  const [shop, setShop] = useState("");
  const [flaggedOnly, setFlaggedOnly] = useState(false);
  const [busy, setBusy] = useState(false);

  const shopName = useMemo(() => new Map(shops.map((s) => [s.id, s.name])), [shops]);

  const filtered = entries.filter(
    (e) =>
      (!person || e.actor_id === person) &&
      (!shop || e.shop_id === shop) &&
      (!flaggedOnly || e.flagged),
  );
  const unseen = entries.filter((e) => !e.seen).length;
  const flagged = entries.filter((e) => e.flagged && !e.seen).length;
  const paging = usePagination(filtered, 25);

  async function refresh() {
    setBusy(true);
    try {
      const res = await fetch("/api/admin/backend/api/activity?limit=500", { cache: "no-store" });
      if (res.ok) setEntries(await res.json());
    } finally {
      setBusy(false);
    }
  }

  async function markAllSeen() {
    setBusy(true);
    try {
      const res = await fetch("/api/admin/backend/api/activity/seen", { method: "POST", body: "{}" });
      if (res.ok) {
        setEntries((prev) => prev.map((e) => ({ ...e, seen: true })));
        window.dispatchEvent(new Event("activity-seen"));
      }
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h2 className="text-2xl font-bold text-[#0f172a]">Activity</h2>
          <p className="text-sm text-[#64748b]">
            Everything your team does — sales, restocks, new products, logins.{" "}
            {unseen > 0 && <b className="text-[#0f172a]">{unseen} new</b>}
            {flagged > 0 && <b className="text-red-700"> · {flagged} need a look</b>}
          </p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" size="sm" onClick={refresh} disabled={busy}>
            <RefreshCw className="mr-1.5 h-3.5 w-3.5" /> Refresh
          </Button>
          <Button size="sm" onClick={markAllSeen} disabled={busy || unseen === 0}>
            <CheckCheck className="mr-1.5 h-3.5 w-3.5" /> Mark all as seen
          </Button>
        </div>
      </div>

      {summary.length > 0 && (
        <div>
          <p className="mb-2 text-xs font-bold uppercase tracking-wider text-[#64748b]">Sales today by person</p>
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
            {summary.map((row) => (
              <Card key={`${row.user_id}-${row.shop_id}`}>
                <CardContent className="p-4">
                  <p className="font-bold text-[#0f172a]">{row.name}</p>
                  <p className="text-xs text-[#64748b]">{shopName.get(row.shop_id || "") || "Main Shop"}</p>
                  <p className="mt-2 text-lg font-bold text-[#166534]">{money(row.total)}</p>
                  <p className="text-xs text-[#64748b]">{row.sales} sale{row.sales === 1 ? "" : "s"}</p>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      )}

      <div className="flex flex-wrap items-center gap-2">
        <select value={person} onChange={(e) => setPerson(e.target.value)} className="rounded-md border border-[#166534]/30 bg-white px-3 py-2 text-sm">
          <option value="">Everyone</option>
          <option value="owner">Owner</option>
          {users.map((u) => (
            <option key={u.id} value={u.id}>{u.name}</option>
          ))}
        </select>
        <select value={shop} onChange={(e) => setShop(e.target.value)} className="rounded-md border border-[#166534]/30 bg-white px-3 py-2 text-sm">
          <option value="">All shops</option>
          {shops.map((s) => (
            <option key={s.id} value={s.id}>{s.name}</option>
          ))}
        </select>
        <label className="flex items-center gap-2 rounded-md border border-[#166534]/30 bg-white px-3 py-2 text-sm">
          <input type="checkbox" checked={flaggedOnly} onChange={(e) => setFlaggedOnly(e.target.checked)} />
          Flagged only
        </label>
      </div>

      <Card>
        <CardContent className="divide-y divide-[#166534]/10 p-0">
          {paging.visible.map((entry) => {
            const Icon = ICONS[entry.action] || UserCog;
            return (
              <div
                key={entry.id}
                className={cn(
                  "flex gap-3 px-4 py-3",
                  entry.flagged && "bg-red-50/70",
                  !entry.seen && !entry.flagged && "bg-[#f0fdf4]/60",
                )}
              >
                <div
                  className={cn(
                    "mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-full",
                    entry.flagged ? "bg-red-100 text-red-700" : "bg-[#dcfce7] text-[#166534]",
                  )}
                >
                  <Icon className="h-4 w-4" />
                </div>
                <div className="min-w-0 flex-1">
                  <p className="text-sm text-[#0f172a]">
                    <b>{entry.actor_name || "System"}</b>{" "}
                    <span className="text-[#475569]">{entry.summary}</span>
                  </p>
                  {entry.flagged && entry.flag_reason && (
                    <p className="mt-1 flex items-start gap-1 text-xs font-semibold text-red-700">
                      <AlertTriangle className="mt-px h-3 w-3 shrink-0" /> {entry.flag_reason}
                    </p>
                  )}
                  <p className="mt-1 flex flex-wrap items-center gap-2 text-xs text-[#94a3b8]">
                    <span>{when(entry.created_at)}</span>
                    {entry.shop_id && <span>· {shopName.get(entry.shop_id) || "Unknown shop"}</span>}
                    {entry.actor_role === "attendant" && <Badge variant="outline" className="text-[10px]">Attendant</Badge>}
                    {!entry.seen && <Badge variant="secondary" className="text-[10px]">New</Badge>}
                  </p>
                </div>
              </div>
            );
          })}
          {filtered.length === 0 && (
            <p className="py-10 text-center text-sm text-[#64748b]">Nothing here yet.</p>
          )}
        </CardContent>
        <Pagination state={paging} label="entries" />
      </Card>
    </div>
  );
}
