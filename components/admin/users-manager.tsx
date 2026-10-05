"use client";

import { useMemo, useState } from "react";
import { KeyRound, Pencil, Plus, Shield, User } from "lucide-react";
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
import type { Shop, StaffUser } from "@/lib/api/types";
import { DeleteButton } from "./delete-button";

const API = "/api/admin/backend/api/users";

type Form = {
  name: string;
  username: string;
  phone: string;
  password: string;
  role: StaffUser["role"];
  shop_id: string;
};

async function send(url: string, method: string, body?: unknown) {
  const res = await fetch(url, {
    method,
    headers: { "Content-Type": "application/json" },
    body: body === undefined ? undefined : JSON.stringify(body),
  });
  const data = await res.json().catch(() => null);
  if (!res.ok) throw new Error((data as { error?: string } | null)?.error || `Request failed (HTTP ${res.status}).`);
  return data;
}

export function UsersManager({ initialUsers, shops }: { initialUsers: StaffUser[]; shops: Shop[] }) {
  const mainShop = shops.find((s) => s.is_main)?.id || shops[0]?.id || "";
  const emptyForm: Form = { name: "", username: "", phone: "", password: "", role: "attendant", shop_id: mainShop };

  const [users, setUsers] = useState(initialUsers);
  const [editing, setEditing] = useState<StaffUser | null>(null);
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState<Form>(emptyForm);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);

  const shopName = useMemo(() => new Map(shops.map((s) => [s.id, s.name])), [shops]);

  function openNew() {
    setEditing(null);
    setForm(emptyForm);
    setError(null);
    setOpen(true);
  }

  function openEdit(user: StaffUser) {
    setEditing(user);
    setForm({
      name: user.name,
      username: user.username,
      phone: user.phone || "",
      password: "",
      role: user.role,
      shop_id: user.shop_id || mainShop,
    });
    setError(null);
    setOpen(true);
  }

  async function save() {
    setSaving(true);
    setError(null);
    try {
      // A blank password on edit means "keep the current one".
      const body = { ...form, password: form.password || undefined };
      const saved = (editing
        ? await send(`${API}/${editing.id}`, "PUT", body)
        : await send(API, "POST", body)) as StaffUser;
      setUsers((prev) => (editing ? prev.map((u) => (u.id === saved.id ? saved : u)) : [...prev, saved]));
      setNotice(
        editing
          ? `${saved.name} updated${form.password ? " — share the new password with them" : ""}.`
          : `${saved.name} can now sign in with username "${saved.username}" and the password you set.`,
      );
      setOpen(false);
    } catch (reason) {
      setError(reason instanceof Error ? reason.message : "Could not save.");
    } finally {
      setSaving(false);
    }
  }

  async function toggleActive(user: StaffUser) {
    try {
      const saved = (await send(`${API}/${user.id}`, "PUT", { is_active: !user.is_active })) as StaffUser;
      setUsers((prev) => prev.map((u) => (u.id === saved.id ? saved : u)));
    } catch (reason) {
      setNotice(reason instanceof Error ? reason.message : "Could not update.");
    }
  }

  async function remove(user: StaffUser) {
    await send(`${API}/${user.id}`, "DELETE");
    setUsers((prev) => prev.filter((u) => u.id !== user.id));
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h2 className="text-2xl font-bold text-[#0f172a]">Users</h2>
          <p className="text-sm text-[#64748b]">
            Attendants can sell, add products and restock in their shop. They can&apos;t change prices, delete
            anything, or see other shops. Everything they do shows up under Activity.
          </p>
        </div>
        <Button onClick={openNew}>
          <Plus className="mr-2 h-4 w-4" /> Add user
        </Button>
      </div>

      {notice && <div className="rounded-lg bg-[#f0fdf4] p-3 text-sm text-[#166534]">{notice}</div>}

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
        {users.map((user) => (
          <Card key={user.id} className={user.is_active ? "" : "opacity-60"}>
            <CardContent className="space-y-3 p-5">
              <div className="flex items-start gap-3">
                <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-[#dcfce7] text-[#166534]">
                  {user.role === "admin" ? <Shield className="h-5 w-5" /> : <User className="h-5 w-5" />}
                </div>
                <div className="min-w-0 flex-1">
                  <p className="truncate font-bold text-[#0f172a]">{user.name}</p>
                  <p className="truncate text-xs text-[#64748b]">@{user.username}{user.phone ? ` · ${user.phone}` : ""}</p>
                </div>
                <Badge variant={user.role === "admin" ? "default" : "secondary"} className="capitalize">
                  {user.role}
                </Badge>
              </div>
              <div className="space-y-1 text-xs text-[#64748b]">
                {user.role === "attendant" && (
                  <p>Shop: <b className="text-[#0f172a]">{shopName.get(user.shop_id || "") || "Main Shop"}</b></p>
                )}
                <p>
                  Last sign-in:{" "}
                  {user.last_login ? new Date(`${user.last_login.replace(/Z?$/, "Z")}`).toLocaleString() : "never"}
                </p>
                {!user.is_active && <p className="font-bold text-amber-700">Disabled — cannot sign in</p>}
              </div>
              <div className="flex flex-wrap gap-2">
                <Button size="sm" variant="outline" onClick={() => openEdit(user)}>
                  <Pencil className="mr-1.5 h-3.5 w-3.5" /> Edit / password
                </Button>
                <Button size="sm" variant="ghost" onClick={() => toggleActive(user)}>
                  {user.is_active ? "Disable" : "Enable"}
                </Button>
                <DeleteButton size="sm" onDelete={() => remove(user)} label={user.name} />
              </div>
            </CardContent>
          </Card>
        ))}
        {users.length === 0 && (
          <p className="text-sm text-[#64748b]">No staff accounts yet. Add your first attendant above.</p>
        )}
      </div>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{editing ? `Edit ${editing.name}` : "Add a user"}</DialogTitle>
            <DialogDescription>
              They sign in at /admin/login with the username and password you set here.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="grid gap-4 sm:grid-cols-2">
              <div>
                <Label htmlFor="u-name">Full name *</Label>
                <Input id="u-name" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} />
              </div>
              <div>
                <Label htmlFor="u-username">Username *</Label>
                <Input id="u-username" value={form.username} autoComplete="off" onChange={(e) => setForm({ ...form, username: e.target.value.replace(/\s/g, "") })} />
              </div>
              <div>
                <Label htmlFor="u-phone">Phone</Label>
                <Input id="u-phone" value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} />
              </div>
              <div>
                <Label htmlFor="u-password" className="flex items-center gap-1">
                  <KeyRound className="h-3 w-3" /> {editing ? "New password" : "Password *"}
                </Label>
                <Input
                  id="u-password"
                  type="text"
                  autoComplete="new-password"
                  value={form.password}
                  placeholder={editing ? "Leave blank to keep" : "At least 4 characters"}
                  onChange={(e) => setForm({ ...form, password: e.target.value })}
                />
              </div>
            </div>
            <div className="grid gap-4 sm:grid-cols-2">
              <div>
                <Label htmlFor="u-role">Role</Label>
                <select
                  id="u-role"
                  value={form.role}
                  onChange={(e) => setForm({ ...form, role: e.target.value as StaffUser["role"] })}
                  className="mt-1 w-full rounded-md border border-[#166534]/30 bg-white px-3 py-2 text-sm"
                >
                  <option value="attendant">Shop attendant</option>
                  <option value="admin">Admin (full access)</option>
                </select>
              </div>
              {form.role === "attendant" && (
                <div>
                  <Label htmlFor="u-shop">Works in</Label>
                  <select
                    id="u-shop"
                    value={form.shop_id}
                    onChange={(e) => setForm({ ...form, shop_id: e.target.value })}
                    className="mt-1 w-full rounded-md border border-[#166534]/30 bg-white px-3 py-2 text-sm"
                  >
                    {shops.filter((s) => s.is_active || s.id === form.shop_id).map((s) => (
                      <option key={s.id} value={s.id}>{s.name}</option>
                    ))}
                  </select>
                </div>
              )}
            </div>
            {error && <div className="rounded-lg border border-red-700 bg-red-50 p-3 text-sm text-red-800">{error}</div>}
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setOpen(false)}>Cancel</Button>
            <Button
              onClick={save}
              disabled={saving || !form.name.trim() || !form.username.trim() || (!editing && !form.password)}
            >
              {saving ? "Saving…" : "Save"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
