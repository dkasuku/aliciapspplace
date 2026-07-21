"use client";

import Link from "next/link";
import { useState } from "react";

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
  { name: "Gaming", slug: "gaming", subcategories: [
    { name: "Gaming Headsets", slug: "gaming-headsets" },
    { name: "Controllers", slug: "controllers" },
    { name: "Gaming Mice", slug: "gaming-mice" },
    { name: "Gaming Keyboards", slug: "gaming-keyboards" },
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

export function MegaMenu() {
  const [openMenu, setOpenMenu] = useState<string | null>(null);

  return <nav className="bg-[#147243] text-white" onMouseLeave={() => setOpenMenu(null)}>
    <div className="mx-auto flex max-w-7xl items-center gap-1 px-5 py-0">
      <Link href="/shop" className="flex shrink-0 items-center px-3 py-3 text-[11px] font-bold uppercase tracking-wider hover:bg-[#0d5933]">Shop all</Link>
      {menuItems.map((item) => (
        <div key={item.slug} className="relative" onMouseEnter={() => setOpenMenu(item.slug)}>
          <Link href={`/categories/${encodeURIComponent(item.slug)}`} className="flex items-center gap-1 whitespace-nowrap px-3 py-3 text-[11px] font-bold uppercase tracking-wider hover:bg-[#0d5933]">{item.name}<span className="text-[8px] opacity-60">▾</span></Link>
          {openMenu === item.slug && (
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
      <a href="#help" className="ml-auto whitespace-nowrap px-3 py-3 text-[11px] font-bold uppercase tracking-wider text-[#c9f7d1] hover:text-white">Support</a>
    </div>
  </nav>;
}
