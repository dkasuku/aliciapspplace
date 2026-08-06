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
import { User, Plus, Mail, Shield, Phone, ChevronDown, ChevronUp } from "lucide-react";
import { DeleteButton } from "./delete-button";
import { useState } from "react";
import { Pagination, usePagination } from "./pagination";

type UserAccount = {
  id: string;
  name: string;
  email: string;
  phone?: string;
  role: "admin" | "staff" | "viewer";
  active: boolean;
  last_login?: string | null;
  created_at?: string;
};

export function UsersManager({ initialUsers }: { initialUsers: UserAccount[] }) {
  const [users, setUsers] = useState<UserAccount[]>(initialUsers);
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({ name: "", email: "", phone: "", role: "staff" as UserAccount["role"] });
  const [expanded, setExpanded] = useState<string | null>(null);

  const addUser = () => {
    if (!form.name || !form.email) return;
    setUsers([
      ...users,
      {
        id: `user-${Date.now()}`,
        name: form.name,
        email: form.email,
        phone: form.phone,
        role: form.role,
        active: true,
        last_login: null,
        created_at: new Date().toISOString(),
      },
    ]);
    setForm({ name: "", email: "", phone: "", role: "staff" });
    setShowForm(false);
  };

  const removeUser = (id: string) => {
    setUsers(users.filter((u) => u.id !== id));
  };

  const toggleActive = (id: string) => {
    setUsers(users.map((u) => (u.id === id ? { ...u, active: !u.active } : u)));
  };

  const roleVariant = (role: string): "default" | "secondary" | "warning" => {
    if (role === "admin") return "default";
    if (role === "viewer") return "secondary";
    return "warning";
  };

  const paging = usePagination(users, 10);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-[#0f172a]">Users</h2>
          <p className="text-sm text-[#64748b]">{users.length} team members</p>
        </div>
        <Button onClick={() => setShowForm(!showForm)}>
          <Plus className="mr-2 h-4 w-4" /> Add user
        </Button>
      </div>

      {showForm && (
        <Card>
          <CardContent className="space-y-4 p-6">
            <div className="grid gap-4 md:grid-cols-3">
              <div>
                <Label htmlFor="user-name">Name</Label>
                <Input id="user-name" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} placeholder="Jane Doe" />
              </div>
              <div>
                <Label htmlFor="user-email">Email</Label>
                <Input id="user-email" type="email" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} placeholder="jane@store.com" />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="user-phone">Phone number</Label>
                <Input id="user-phone" type="tel" value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} placeholder="07xx xxx xxx" />
              </div>
              <div>
                <Label htmlFor="user-role">Role</Label>
                <select id="user-role" value={form.role} onChange={(e) => setForm({ ...form, role: e.target.value as UserAccount["role"] })} className="mt-1 w-full rounded-md border border-input bg-background px-3 py-2 text-sm">
                  <option value="admin">Admin</option>
                  <option value="staff">Staff</option>
                  <option value="viewer">Viewer</option>
                </select>
              </div>
            </div>
            <div className="flex gap-2">
              <Button onClick={addUser}>Save user</Button>
              <Button variant="outline" onClick={() => setShowForm(false)}>Cancel</Button>
            </div>
          </CardContent>
        </Card>
      )}

      {users.length === 0 && !showForm ? (
        <Card>
          <CardContent className="py-16 text-center">
            <User className="mx-auto h-12 w-12 text-[#cbd5e1]" />
            <p className="mt-4 text-sm text-[#64748b]">No team members yet.</p>
            <p className="mt-1 text-xs text-[#94a3b8]">Add users to give them access to the admin panel.</p>
          </CardContent>
        </Card>
      ) : (
        <>
        <div className="space-y-3">
          {paging.visible.map((user) => (
            <Card key={user.id}>
              <CardContent className="flex items-center justify-between p-4">
                <div className="flex items-center gap-4">
                  <div className="grid h-10 w-10 place-items-center rounded-full bg-[#dcfce7]">
                    <User className="h-5 w-5 text-[#166534]" />
                  </div>
                  <div>
                    <p className="font-bold text-[#0f172a]">{user.name}</p>
                    <div className="flex items-center gap-2 text-xs text-[#64748b]">
                      <Mail className="h-3 w-3" />
                      {user.email}
                    </div>
                    {user.phone && (
                      <div className="flex items-center gap-2 text-xs text-[#64748b]">
                        <Phone className="h-3 w-3" />
                        {user.phone}
                      </div>
                    )}
                    {user.last_login && (
                      <p className="text-xs text-[#94a3b8]">Last login: {new Date(user.last_login).toLocaleDateString()}</p>
                    )}
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <div className="flex items-center gap-1">
                    <Shield className="h-3.5 w-3.5 text-[#64748b]" />
                    <Badge variant={roleVariant(user.role)}>{user.role}</Badge>
                  </div>
                  <Badge variant={user.active ? "default" : "secondary"} onClick={() => toggleActive(user.id)} className="cursor-pointer">
                    {user.active ? "Active" : "Inactive"}
                  </Badge>
                  <Button
                    variant="ghost"
                    size="icon"
                    aria-label={expanded === user.id ? "Hide details" : "Show details"}
                    onClick={() => setExpanded(expanded === user.id ? null : user.id)}
                  >
                    {expanded === user.id ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
                  </Button>
                  <DeleteButton onDelete={() => removeUser(user.id)} label={user.name} />
                </div>
              </CardContent>
              {expanded === user.id && (
                <div className="border-t border-[#166534]/15 bg-[#f8faf5] px-4 py-4 text-sm">
                  <dl className="grid gap-x-6 gap-y-2 sm:grid-cols-2">
                    <div><dt className="text-xs text-[#64748b]">Full name</dt><dd className="font-medium text-[#0f172a]">{user.name}</dd></div>
                    <div><dt className="text-xs text-[#64748b]">Role</dt><dd className="font-medium capitalize text-[#0f172a]">{user.role}</dd></div>
                    <div>
                      <dt className="text-xs text-[#64748b]">Email</dt>
                      <dd><a href={`mailto:${user.email}`} className="font-medium text-[#166534] underline">{user.email}</a></dd>
                    </div>
                    <div>
                      <dt className="text-xs text-[#64748b]">Phone</dt>
                      <dd>
                        {user.phone ? (
                          <a href={`tel:${user.phone.replace(/\s/g, "")}`} className="font-medium text-[#166534] underline">{user.phone}</a>
                        ) : (
                          <span className="text-[#94a3b8]">Not set</span>
                        )}
                      </dd>
                    </div>
                    <div><dt className="text-xs text-[#64748b]">Status</dt><dd className="font-medium text-[#0f172a]">{user.active ? "Active" : "Inactive"}</dd></div>
                    <div>
                      <dt className="text-xs text-[#64748b]">Added</dt>
                      <dd className="font-medium text-[#0f172a]">{user.created_at ? new Date(user.created_at).toLocaleDateString() : "—"}</dd>
                    </div>
                    <div className="sm:col-span-2">
                      <dt className="text-xs text-[#64748b]">Last login</dt>
                      <dd className="font-medium text-[#0f172a]">{user.last_login ? new Date(user.last_login).toLocaleString() : "Never signed in"}</dd>
                    </div>
                  </dl>
                </div>
              )}
            </Card>
          ))}
        </div>
          <div className="rounded-xl border border-[#166534]/15 bg-white">
            <Pagination state={paging} label="users" />
          </div>
        </>
      )}
    </div>
  );
}
