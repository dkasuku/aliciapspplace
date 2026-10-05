"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { Bell } from "lucide-react";
import { cn } from "@/lib/utils";

type Counts = { unseen: number; flagged: number };

/** Unread staff activity, checked every 30 seconds. Red when something is flagged. */
export function ActivityBell() {
  const [counts, setCounts] = useState<Counts>({ unseen: 0, flagged: 0 });

  useEffect(() => {
    let alive = true;
    async function load() {
      try {
        const res = await fetch("/api/admin/backend/api/activity/unseen", { cache: "no-store" });
        if (res.ok && alive) setCounts(await res.json());
      } catch {}
    }
    void load();
    const timer = setInterval(load, 30_000);
    // The activity page marks things seen; it tells us to refresh right away.
    window.addEventListener("activity-seen", load);
    return () => {
      alive = false;
      clearInterval(timer);
      window.removeEventListener("activity-seen", load);
    };
  }, []);

  const alert = counts.flagged > 0;
  return (
    <Link
      href="/admin/activity"
      title={
        counts.unseen
          ? `${counts.unseen} new staff activit${counts.unseen === 1 ? "y" : "ies"}${alert ? `, ${counts.flagged} flagged` : ""}`
          : "Staff activity"
      }
      className="relative rounded-lg p-2 text-[#166534] hover:bg-[#f0fdf4]"
    >
      <Bell className="h-5 w-5" />
      {counts.unseen > 0 && (
        <span
          className={cn(
            "absolute -right-0.5 -top-0.5 min-w-[18px] rounded-full px-1 text-center text-[10px] font-bold leading-[18px] text-white",
            alert ? "bg-red-600" : "bg-[#166534]",
          )}
        >
          {counts.unseen > 99 ? "99+" : counts.unseen}
        </span>
      )}
    </Link>
  );
}
