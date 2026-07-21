"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useState } from "react";
import { useCart } from "./cart-provider";
import type { SiteContent } from "@/lib/site-content";

type SubItem = { name: string; slug: string };
type MenuItem = { name: string; slug: string; subcategories: SubItem[] };

const menuItems: MenuItem[] = [
  { name: "Samsung", slug: "samsung", subcategories: [
    { name: "Galaxy S Series", slug: "samsung-galaxy-s" },
    { name: "Galaxy A Series", slug: "samsung-galaxy-a" },
    { name: "Galaxy Z Fold", slug: "samsung-galaxy-z" },
    { name: "Galaxy Tab", slug: "samsung-galaxy-tab" },
  ]},
  { name: "Apple", slug: "apple", subcategories: [
    { name: "iPhone", slug: "apple-iphone" },
    { name: "iPad", slug: "apple-ipad" },
    { name: "Apple Watch", slug: "apple-watch" },
    { name: "AirPods", slug: "apple-airpods" },
    { name: "MacBook", slug: "apple-macbook" },
  ]},
  { name: "Smartphones", slug: "smartphones", subcategories: [
    { name: "Samsung Phones", slug: "samsung-phones" },
    { name: "iPhone", slug: "iphone" },
    { name: "Tecno", slug: "tecno" },
    { name: "Google Pixel", slug: "google-pixel" },
  ]},
  { name: "Mobile Accessories", slug: "mobile-accessories", subcategories: [
    { name: "Chargers", slug: "chargers" },
    { name: "Power Banks", slug: "power-banks" },
    { name: "Phone Cases", slug: "phone-cases" },
    { name: "Cables", slug: "cables" },
    { name: "Screen Protectors", slug: "screen-protectors" },
  ]},
  { name: "Audio", slug: "audio", subcategories: [
    { name: "Wireless Headphones", slug: "wireless-headphones" },
    { name: "Earbuds", slug: "earbuds" },
    { name: "Bluetooth Speakers", slug: "bluetooth-speakers" },
    { name: "Wired Headphones", slug: "wired-headphones" },
  ]},
  { name: "Tablets", slug: "tablets", subcategories: [
    { name: "iPad", slug: "ipad" },
    { name: "Samsung Galaxy Tab", slug: "samsung-galaxy-tab-tablets" },
    { name: "Android Tablets", slug: "android-tablets" },
  ]},
  { name: "Content Creator Kit", slug: "content-creator-kit", subcategories: [
    { name: "Microphones", slug: "microphones" },
    { name: "Ring Lights", slug: "ring-lights" },
    { name: "Tripods", slug: "tripods" },
    { name: "Portable SSDs", slug: "portable-ssds" },
    { name: "Webcams", slug: "webcams" },
  ]},
];

export function SiteHeader({ siteContent }: { siteContent?: SiteContent }) {
  const [mobileOpen, setMobileOpen] = useState(false);
  const [expandedMenu, setExpandedMenu] = useState<string | null>(null);
  const [hoverMenu, setHoverMenu] = useState<string | null>(null);
  const [searchValue, setSearchValue] = useState("");
  const { cart } = useCart();
  const router = useRouter();
  const pathname = usePathname();

  const cartCount = cart.item_count ?? cart.items?.reduce((sum, item) => sum + item.quantity, 0) ?? 0;

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    const q = searchValue.trim();
    if (pathname === "/") {
      if (q) {
        router.push(`/shop?q=${encodeURIComponent(q)}`);
      } else {
        document.getElementById("catalog")?.scrollIntoView({ behavior: "smooth" });
      }
    } else {
      router.push(q ? `/shop?q=${encodeURIComponent(q)}` : "/shop");
    }
  };

  const closeMobile = () => setMobileOpen(false);

  return (
    <>
      {siteContent?.deliveryBanner?.enabled !== false && (
      <div className="border-t-4 border-[#147243] bg-[#0d2118] py-2 text-[10px] font-bold uppercase tracking-[0.16em] text-[#d9f2db]">
        <div className="mx-auto flex max-w-7xl justify-between px-5">
          <span>{siteContent?.deliveryBanner?.text || "Free delivery around Juja town"}</span>
          <a href={`tel:${(siteContent?.footer?.phone || "+254724126009").replace(/\s/g, "")}`} className="hidden hover:text-white sm:block">{siteContent?.deliveryBanner?.helpText || "Need help? Call +254 724 126 009"}</a>
        </div>
      </div>
      )}

      <header className="sticky top-0 z-40 border-b border-[#dbe5dc] bg-white/95 backdrop-blur">
        <div className="mx-auto flex max-w-7xl items-center gap-3 px-5 py-2">
          <button
            type="button"
            onClick={() => setMobileOpen((v) => !v)}
            aria-label="Toggle menu"
            className="grid h-9 w-9 shrink-0 place-items-center rounded-lg border border-[#cce0d1] text-[#123625] hover:bg-[#edf8ef] md:hidden"
          >
            {mobileOpen ? (
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="h-5 w-5"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
            ) : (
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="h-5 w-5"><line x1="3" y1="6" x2="21" y2="6"/><line x1="3" y1="12" x2="21" y2="12"/><line x1="3" y1="18" x2="21" y2="18"/></svg>
            )}
          </button>

          <Link href="/" className="flex shrink-0 items-center gap-2">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={siteContent?.logoUrl || "/Phoneplacelg.png"} alt="Alicia Phone Store" className="h-16 w-auto max-w-[220px] object-contain" />
          </Link>

          <form onSubmit={handleSearch} className="hidden flex-1 md:block">
            <label className="flex max-w-xl overflow-hidden rounded-xl border border-[#cfdbd1] bg-[#f8faf8] focus-within:border-[#147243] focus-within:ring-2 focus-within:ring-[#b6e5c1]">
              <input
                value={searchValue}
                onChange={(e) => setSearchValue(e.target.value)}
                className="min-w-0 flex-1 bg-transparent px-4 py-2.5 text-sm outline-none"
                placeholder="Search phones, audio and accessories"
              />
              <button type="submit" className="bg-[#147243] px-5 text-xs font-bold uppercase tracking-wider text-white hover:bg-[#0d5933]">Search</button>
            </label>
          </form>

          <nav className="ml-auto hidden items-center gap-4 text-xs font-bold text-[#345140] lg:flex">
            {siteContent?.headerNav?.filter((n) => n.enabled).map((nav) => (
              <Link key={nav.id} href={nav.href} className="hover:text-[#147243]">{nav.label}</Link>
            ))}
          </nav>

          <Link
            href="/cart"
            aria-label={`Cart with ${cartCount} items`}
            className="flex items-center gap-2 rounded-xl border border-[#cce0d1] px-3 py-2 text-xs font-bold text-[#123625] hover:bg-[#edf8ef]"
          >
            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="h-4 w-4">
              <circle cx="8" cy="21" r="1"/><circle cx="19" cy="21" r="1"/>
              <path d="M2.05 2.05h2l2.66 12.42a2 2 0 0 0 2 1.58h9.78a2 2 0 0 0 1.95-1.57l1.65-7.43H5.12"/>
            </svg>
            <span className="hidden sm:inline">Bag</span>
            <span className="grid min-w-5 place-items-center rounded-full bg-[#147243] px-1 py-0.5 text-[10px] text-white">{cartCount}</span>
          </Link>
        </div>

        {/* Desktop mega-menu */}
        <nav className="hidden bg-[#147243] text-white md:block" onMouseLeave={() => setHoverMenu(null)}>
          <div className="mx-auto flex max-w-7xl items-center gap-1 px-5">
            <Link href="/" className="flex shrink-0 items-center px-3 py-3 text-[11px] font-bold uppercase tracking-wider hover:bg-[#0d5933]">Home</Link>
            <Link href="/shop" className="flex shrink-0 items-center px-3 py-3 text-[11px] font-bold uppercase tracking-wider hover:bg-[#0d5933]">Shop all</Link>
            {menuItems.map((item) => (
              <div key={item.slug} className="relative" onMouseEnter={() => setHoverMenu(item.slug)}>
                <Link href={`/categories/${encodeURIComponent(item.slug)}`} className="flex items-center gap-1 whitespace-nowrap px-3 py-3 text-[11px] font-bold uppercase tracking-wider hover:bg-[#0d5933]">
                  {item.name}<span className="text-[8px] opacity-60">▾</span>
                </Link>
                {hoverMenu === item.slug && (
                  <div className="absolute left-0 top-full z-50 min-w-56 rounded-b-xl border border-[#0d5933] bg-white py-2 text-[#17251f] shadow-2xl">
                    <p className="px-4 pb-2 text-[9px] font-bold uppercase tracking-[0.18em] text-[#18864e]">{item.name}</p>
                    {item.subcategories.map((sub) => (
                      <Link key={sub.slug} href={`/categories/${encodeURIComponent(sub.slug)}`} className="block px-4 py-2 text-xs font-semibold text-[#345140] hover:bg-[#f0fdf4] hover:text-[#147243]">{sub.name}</Link>
                    ))}
                    <Link href={`/categories/${encodeURIComponent(item.slug)}`} className="mt-1 block border-t border-[#e2ece4] px-4 pt-2 text-[10px] font-black uppercase tracking-wider text-[#147243] hover:text-[#0d5933]">Browse all {item.name} →</Link>
                  </div>
                )}
              </div>
            ))}
            <Link href="/blog" className="ml-auto whitespace-nowrap px-3 py-3 text-[11px] font-bold uppercase tracking-wider text-[#c9f7d1] hover:text-white">Blog</Link>
            <a href="tel:+254724126009" className="whitespace-nowrap px-3 py-3 text-[11px] font-bold uppercase tracking-wider text-[#c9f7d1] hover:text-white">+254 724 126 009</a>
          </div>
        </nav>

        {/* Mobile slide-down menu */}
        {mobileOpen && (
          <div className="border-t border-[#dbe5dc] bg-white md:hidden">
            <form onSubmit={handleSearch} className="px-5 py-3">
              <label className="flex overflow-hidden rounded-xl border border-[#cfdbd1] bg-[#f8faf8]">
                <input
                  value={searchValue}
                  onChange={(e) => setSearchValue(e.target.value)}
                  className="min-w-0 flex-1 bg-transparent px-4 py-2.5 text-sm outline-none"
                  placeholder="Search products..."
                />
                <button type="submit" className="bg-[#147243] px-4 text-xs font-bold text-white">Go</button>
              </label>
            </form>
            <div className="max-h-[70vh] overflow-y-auto px-2 pb-4">
              <Link href="/" onClick={closeMobile} className="block rounded-lg px-3 py-3 text-sm font-bold uppercase tracking-wider text-[#147243] hover:bg-[#f0fdf4]">Home</Link>
              <Link href="/shop" onClick={closeMobile} className="block rounded-lg px-3 py-3 text-sm font-bold uppercase tracking-wider text-[#147243] hover:bg-[#f0fdf4]">Shop all</Link>
              {menuItems.map((item) => (
                <div key={item.slug}>
                  <button
                    type="button"
                    onClick={() => setExpandedMenu(expandedMenu === item.slug ? null : item.slug)}
                    className="flex w-full items-center justify-between rounded-lg px-3 py-3 text-sm font-bold text-[#17251f] hover:bg-[#f0fdf4]"
                  >
                    <span>{item.name}</span>
                    <span className="text-xs text-[#147243]">{expandedMenu === item.slug ? "−" : "+"}</span>
                  </button>
                  {expandedMenu === item.slug && (
                    <div className="ml-4 border-l border-[#e2ece4]">
                      {item.subcategories.map((sub) => (
                        <Link key={sub.slug} href={`/categories/${encodeURIComponent(sub.slug)}`} onClick={closeMobile} className="block px-4 py-2 text-xs font-semibold text-[#345140] hover:text-[#147243]">{sub.name}</Link>
                      ))}
                      <Link href={`/categories/${encodeURIComponent(item.slug)}`} onClick={closeMobile} className="block px-4 py-2 text-[10px] font-black uppercase tracking-wider text-[#147243]">Browse all {item.name} →</Link>
                    </div>
                  )}
                </div>
              ))}
              <Link href="/blog" onClick={closeMobile} className="block rounded-lg px-3 py-3 text-sm font-bold uppercase tracking-wider text-[#147243] hover:bg-[#f0fdf4]">Blog</Link>
              <a href="tel:+254724126009" onClick={closeMobile} className="block rounded-lg px-3 py-3 text-sm font-bold uppercase tracking-wider text-[#147243] hover:bg-[#f0fdf4]">+254 724 126 009</a>
            </div>
          </div>
        )}
      </header>
    </>
  );
}
