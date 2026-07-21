"use client";

import { useMemo } from "react";
import type { SiteContent } from "@/lib/site-content";

const defaultItems = [
  { id: "mb-1", title: "COUNTRY WIDE DELIVERY", subtitle: "Fast Delivery", enabled: true },
  { id: "mb-2", title: "GREAT PRICES", subtitle: "Best Price Guarantee", enabled: true },
  { id: "mb-3", title: "SUPPORT 24/7", subtitle: "Get In Touch With Us", enabled: true },
  { id: "mb-4", title: "QUALITY GUARANTEE", subtitle: "Original Product", enabled: true },
];

export function MotionBanner({ siteContent }: { siteContent?: SiteContent }) {
  const items = (siteContent?.motionBanner?.filter((i) => i.enabled).length ? siteContent.motionBanner.filter((i) => i.enabled) : defaultItems).map((item) => ({
    title: item.title,
    subtitle: item.subtitle,
    icon: DeliveryIcon,
  }));
  const track = useMemo(() => [...items, ...items, ...items], [items]);
  return <section aria-label="Store guarantees" className="overflow-hidden bg-white py-8 shadow-inner">
    <div className="motion-banner-track flex w-max">
      {track.map((item, index) => (
        <div key={`${item.title}-${index}`} className="flex w-72 shrink-0 items-center gap-4 px-8">
          <div className="grid h-12 w-12 shrink-0 place-items-center rounded-full bg-[#e7f5e8] text-[#147243]">
            <item.icon className="h-6 w-6" />
          </div>
          <div>
            <p className="text-[11px] font-black tracking-wider text-[#147243]">{item.title}</p>
            <p className="text-xs font-semibold text-[#587061]">{item.subtitle}</p>
          </div>
        </div>
      ))}
    </div>
    <style jsx>{`
      .motion-banner-track {
        animation: scroll-rtl 28s linear infinite;
      }
      .motion-banner-track:hover {
        animation-play-state: paused;
      }
      @keyframes scroll-rtl {
        0% { transform: translateX(0); }
        100% { transform: translateX(-50%); }
      }
    `}</style>
  </section>;
}

function DeliveryIcon({ className }: { className?: string }) {
  return <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><rect x="1" y="3" width="15" height="13"/><polygon points="16 8 20 8 23 11 23 16 16 16 16 8"/><circle cx="5.5" cy="18.5" r="2.5"/><circle cx="18.5" cy="18.5" r="2.5"/></svg>;
}

function PriceIcon({ className }: { className?: string }) {
  return <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><path d="M12 2v20"/><path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6"/></svg>;
}

function SupportIcon({ className }: { className?: string }) {
  return <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72 12.07 12.07 0 0 0 .65 2.81 2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45 12.07 12.07 0 0 0 2.81.65A2 2 0 0 1 22 16.92z"/></svg>;
}

function QualityIcon({ className }: { className?: string }) {
  return <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/><path d="m9 12 2 2 4-4"/></svg>;
}
