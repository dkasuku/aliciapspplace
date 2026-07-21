"use client";

import { useState, useTransition } from "react";
import { Plus, Trash2, Tag, Pencil } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import {
  Card,
  CardContent,
} from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import type { Category } from "@/lib/api/types";

const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000";

export function CategoriesManager({ initialCategories }: { initialCategories: Category[] }) {
  const [categories, setCategories] = useState(initialCategories);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editing, setEditing] = useState<Category | null>(null);
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [isActive, setIsActive] = useState(true);
  const [pending, startTransition] = useTransition();

  function openCreate() {
    setEditing(null);
    setName("");
    setDescription("");
    setIsActive(true);
    setDialogOpen(true);
  }

  function openEdit(cat: Category) {
    setEditing(cat);
    setName(cat.name);
    setDescription(cat.description || "");
    setIsActive(cat.is_active ?? true);
    setDialogOpen(true);
  }

  async function save() {
    if (!name.trim()) return;
    startTransition(async () => {
      try {
        if (editing) {
          const res = await fetch(`${API_URL}/api/categories/${editing.id}`, {
            method: "PUT",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ name, description, is_active: isActive }),
          });
          if (res.ok) {
            const updated = await res.json().catch(() => null);
            setCategories((prev) => prev.map((c) => c.id === editing.id ? (updated || { ...c, name, description, is_active: isActive }) : c));
          } else {
            setCategories((prev) => prev.map((c) => c.id === editing.id ? { ...c, name, description, is_active: isActive } : c));
          }
        } else {
          const res = await fetch(`${API_URL}/api/categories`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ name, description, is_active: isActive }),
          });
          if (res.ok) {
            const cat = await res.json();
            setCategories((prev) => [...prev, cat]);
          } else {
            const slug = name.toLowerCase().replaceAll(" ", "-");
            setCategories((prev) => [...prev, { id: `cat-${Date.now()}`, name, slug, description, is_active: isActive }]);
          }
        }
        setDialogOpen(false);
        setName("");
        setDescription("");
        setIsActive(true);
        setEditing(null);
      } catch {
        if (editing) {
          setCategories((prev) => prev.map((c) => c.id === editing.id ? { ...c, name, description, is_active: isActive } : c));
        } else {
          const slug = name.toLowerCase().replaceAll(" ", "-");
          setCategories((prev) => [...prev, { id: `cat-${Date.now()}`, name, slug, description, is_active: isActive }]);
        }
        setDialogOpen(false);
        setName("");
        setDescription("");
        setIsActive(true);
        setEditing(null);
      }
    });
  }

  async function remove(id: string) {
    if (!confirm("Delete this category?")) return;
    startTransition(async () => {
      try {
        await fetch(`${API_URL}/api/categories/${id}`, { method: "DELETE" });
      } catch {}
      setCategories((prev) => prev.filter((c) => c.id !== id));
    });
  }

  async function toggleActive(cat: Category) {
    const newVal = !cat.is_active;
    setCategories((prev) => prev.map((c) => c.id === cat.id ? { ...c, is_active: newVal } : c));
    try {
      await fetch(`${API_URL}/api/categories/${cat.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ is_active: newVal }),
      });
    } catch {}
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-[#0f172a]">Categories</h2>
          <p className="text-sm text-[#64748b]">{categories.length} categories</p>
        </div>
        <Button onClick={openCreate}>
          <Plus className="mr-2 h-4 w-4" /> Add category
        </Button>
      </div>

      <Card>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Name</TableHead>
                <TableHead>Slug</TableHead>
                <TableHead>Description</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {categories.map((cat) => (
                <TableRow key={cat.id}>
                  <TableCell className="font-medium">
                    <div className="flex items-center gap-2">
                      <Tag className="h-3 w-3 text-[#166534]" />
                      {cat.name}
                    </div>
                  </TableCell>
                  <TableCell className="text-[#64748b]">{cat.slug}</TableCell>
                  <TableCell className="text-[#64748b]">{cat.description || "—"}</TableCell>
                  <TableCell>
                    <button onClick={() => toggleActive(cat)}>
                      <Badge variant={cat.is_active ? "default" : "outline"} className="cursor-pointer">
                        {cat.is_active ? "Active" : "Inactive"}
                      </Badge>
                    </button>
                  </TableCell>
                  <TableCell className="text-right">
                    <div className="flex items-center justify-end gap-1">
                      <Button variant="ghost" size="icon" onClick={() => openEdit(cat)} title="Edit category">
                        <Pencil className="h-4 w-4 text-[#166534]" />
                      </Button>
                      <Button variant="ghost" size="icon" onClick={() => remove(cat.id)} title="Delete category">
                        <Trash2 className="h-4 w-4 text-red-600" />
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
              {categories.length === 0 && (
                <TableRow>
                  <TableCell colSpan={5} className="text-center text-[#64748b]">
                    No categories yet.
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{editing ? "Edit category" : "New category"}</DialogTitle>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid gap-2">
              <Label htmlFor="cat-name">Name *</Label>
              <Input id="cat-name" value={name} onChange={(e) => setName(e.target.value)} />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="cat-desc">Description</Label>
              <Input id="cat-desc" value={description} onChange={(e) => setDescription(e.target.value)} />
            </div>
            <div className="flex items-center gap-2">
              <input
                type="checkbox"
                id="cat-active"
                checked={isActive}
                onChange={(e) => setIsActive(e.target.checked)}
                className="h-4 w-4 rounded border-[#166534]/30"
              />
              <Label htmlFor="cat-active">Active (visible on storefront)</Label>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDialogOpen(false)}>Cancel</Button>
            <Button onClick={save} disabled={pending || !name.trim()}>
              {pending ? "Saving..." : editing ? "Save changes" : "Create category"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
