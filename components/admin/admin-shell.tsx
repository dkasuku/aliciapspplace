"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState } from "react";
import {
  LayoutDashboard,
  Package,
  Boxes,
  ShoppingCart,
  Tag,
  Receipt,
  ClipboardList,
  RotateCcw,
  Smartphone,
  Truck,
  Percent,
  Bot,
  Users,
  Image,
  ChevronDown,
  Store,
} from "lucide-react";
import { cn } from "@/lib/utils";
import type { Stats } from "@/lib/api/types";

type NavLeaf = { href: string; label: string; icon: typeof LayoutDashboard };
type NavGroup = { label: string; icon: typeof LayoutDashboard; children: NavLeaf[] };
type NavItem = NavLeaf | NavGroup;

function isGroup(item: NavItem): item is NavGroup {
  return "children" in item;
}

const navItems: NavItem[] = [
  { href: "/admin", label: "Home", icon: LayoutDashboard },
  {
    label: "Catalog",
    icon: Package,
    children: [
      { href: "/admin/products", label: "Products", icon: Package },
      { href: "/admin/categories", label: "Categories", icon: Tag },
      { href: "/admin/inventory", label: "Inventory", icon: Boxes },
    ],
  },
  {
    label: "Sales",
    icon: Receipt,
    children: [
      { href: "/admin/orders", label: "Orders", icon: Receipt },
      { href: "/admin/pos", label: "POS / Sell", icon: ShoppingCart },
      { href: "/admin/sales", label: "Sales History", icon: ClipboardList },
      { href: "/admin/discounts", label: "Discounts", icon: Percent },
      { href: "/admin/returns", label: "Returns", icon: RotateCcw },
      { href: "/admin/rentals", label: "Lipa Pole Pole", icon: Smartphone },
    ],
  },
  {
    label: "Store",
    icon: Store,
    children: [
      { href: "/admin/banners", label: "Banners & Content", icon: Image },
      { href: "/admin/shipping", label: "Shipping", icon: Truck },
      { href: "/admin/agents", label: "AI Agents", icon: Bot },
      { href: "/admin/users", label: "Users", icon: Users },
    ],
  },
];

export function AdminShell({ children, stats }: { children: React.ReactNode; stats: Stats | null }) {
  const pathname = usePathname();

  const isPathInGroup = (group: NavGroup) =>
    group.children.some((child) => pathname === child.href || pathname.startsWith(child.href + "/"));

  const defaultOpen = navItems.filter(isGroup).filter(isPathInGroup).map((g) => g.label);
  const [openGroups, setOpenGroups] = useState<string[]>(defaultOpen);

  function toggleGroup(label: string) {
    setOpenGroups((prev) => (prev.includes(label) ? prev.filter((g) => g !== label) : [...prev, label]));
  }

  const isLeafActive = (href: string) =>
    pathname === href || (href !== "/admin" && pathname.startsWith(href + "/"));

  function renderNavItem(item: NavItem) {
    if (isGroup(item)) {
      const isOpen = openGroups.includes(item.label);
      const isGroupActive = isPathInGroup(item);
      const Icon = item.icon;
      return (
        <div key={item.label}>
          <button
            type="button"
            onClick={() => toggleGroup(item.label)}
            className={cn(
              "flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-colors",
              isGroupActive
                ? "text-[#166534]"
                : "text-[#475569] hover:bg-[#f0fdf4] hover:text-[#166534]"
            )}
          >
            <Icon className="h-4 w-4" />
            <span className="flex-1 text-left">{item.label}</span>
            <ChevronDown
              className={cn("h-3.5 w-3.5 transition-transform", isOpen && "rotate-180")}
            />
          </button>
          {isOpen && (
            <div className="ml-4 mt-0.5 space-y-0.5 border-l border-[#166534]/15 pl-3">
              {item.children.map((child) => {
                const active = isLeafActive(child.href);
                const ChildIcon = child.icon;
                return (
                  <Link
                    key={child.href}
                    href={child.href}
                    className={cn(
                      "flex items-center gap-2.5 rounded-md px-3 py-2 text-[13px] font-medium transition-colors",
                      active
                        ? "bg-[#166534] text-white"
                        : "text-[#64748b] hover:bg-[#f0fdf4] hover:text-[#166534]"
                    )}
                  >
                    <ChildIcon className="h-3.5 w-3.5" />
                    {child.label}
                  </Link>
                );
              })}
            </div>
          )}
        </div>
      );
    }

    const active = isLeafActive(item.href);
    const Icon = item.icon;
    return (
      <Link
        key={item.href}
        href={item.href}
        className={cn(
          "flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-colors",
          active
            ? "bg-[#166534] text-white"
            : "text-[#475569] hover:bg-[#f0fdf4] hover:text-[#166534]"
        )}
      >
        <Icon className="h-4 w-4" />
        {item.label}
      </Link>
    );
  }

  const flatNavForMobile: NavLeaf[] = [
    { href: "/admin", label: "Home", icon: LayoutDashboard },
    { href: "/admin/products", label: "Products", icon: Package },
    { href: "/admin/categories", label: "Categories", icon: Tag },
    { href: "/admin/inventory", label: "Inventory", icon: Boxes },
    { href: "/admin/orders", label: "Orders", icon: Receipt },
    { href: "/admin/pos", label: "POS / Sell", icon: ShoppingCart },
    { href: "/admin/sales", label: "Sales", icon: ClipboardList },
    { href: "/admin/discounts", label: "Discounts", icon: Percent },
    { href: "/admin/returns", label: "Returns", icon: RotateCcw },
    { href: "/admin/rentals", label: "Lipa Pole Pole", icon: Smartphone },
    { href: "/admin/banners", label: "Banners & Content", icon: Image },
    { href: "/admin/shipping", label: "Shipping", icon: Truck },
    { href: "/admin/agents", label: "AI Agents", icon: Bot },
    { href: "/admin/users", label: "Users", icon: Users },
  ];

  return (
    <div className="flex min-h-screen bg-[#f8faf5]">
      <aside className="hidden w-64 shrink-0 border-r border-[#166534]/15 bg-white md:flex md:flex-col">
        <div className="flex h-16 items-center gap-2 border-b border-[#166534]/15 px-6">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src="/Phoneplacelg.png" alt="Alicia Phone Store" className="h-16 w-auto max-w-[220px] object-contain" />
        </div>
        <nav className="flex-1 space-y-1 overflow-y-auto p-3">
          {navItems.map(renderNavItem)}
        </nav>
        {stats && (
          <div className="border-t border-[#166534]/15 p-4">
            <div className="space-y-2 text-xs">
              <div className="flex justify-between">
                <span className="text-[#64748b]">Revenue</span>
                <span className="font-bold text-[#166534]">KES {stats.revenue.toLocaleString()}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-[#64748b]">Products</span>
                <span className="font-bold">{stats.total_products}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-[#64748b]">Low stock</span>
                <span className="font-bold text-amber-600">{stats.low_stock}</span>
              </div>
            </div>
          </div>
        )}
      </aside>

      <div className="flex flex-1 flex-col">
        <header className="flex h-16 items-center justify-between border-b border-[#166534]/15 bg-white px-4 sm:px-6">
          <div className="flex items-center gap-3 md:hidden">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src="/Phoneplacelg.png" alt="Alicia Phone Store" className="h-14 w-auto max-w-[200px] object-contain" />
          </div>
          <h1 className="hidden text-lg font-bold text-[#0f172a] md:block">Admin Panel</h1>
          <div className="flex items-center gap-2 sm:gap-3">
            <Link href="/" className="text-sm font-medium text-[#166534] hover:underline">
              <span className="hidden sm:inline">View store →</span>
              <span className="sm:hidden">Store →</span>
            </Link>
            <form action="/api/admin/logout" method="POST">
              <button type="submit" className="rounded-lg border border-[#166534]/30 px-3 py-1.5 text-xs font-bold text-[#166534] hover:bg-[#f0fdf4]">
                Logout
              </button>
            </form>
          </div>
        </header>

        <nav className="flex overflow-x-auto border-b border-[#166534]/15 bg-white px-4 md:hidden">
          {flatNavForMobile.map((item) => {
            const active = isLeafActive(item.href);
            return (
              <Link
                key={item.href}
                href={item.href}
                className={cn(
                  "whitespace-nowrap px-3 py-3 text-sm font-medium",
                  active ? "border-b-2 border-[#166534] text-[#166534]" : "text-[#64748b]"
                )}
              >
                {item.label}
              </Link>
            );
          })}
        </nav>

        <main className="flex-1 overflow-y-auto p-4 sm:p-6">{children}</main>
      </div>
    </div>
  );
}
