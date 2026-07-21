import { api } from "@/lib/api";
import { CategoriesManager } from "@/components/admin/categories-manager";
import { fallbackCategories } from "@/lib/catalog";
import type { Category } from "@/lib/api/types";

export const dynamic = "force-dynamic";

export default async function AdminCategoriesPage() {
  let categories: Category[] = [];
  try {
    categories = await api.categories.list();
  } catch {}
  if (!categories.length) categories = fallbackCategories;
  return <CategoriesManager initialCategories={categories} />;
}
