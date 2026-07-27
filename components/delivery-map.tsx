"use client";

import { useEffect, useRef, useState } from "react";
import type * as LeafletNS from "leaflet";
import "leaflet/dist/leaflet.css";
import { JUJA_TOWN_KM, NAIROBI_ZONE_KM, SHOP_LOCATION, type LatLng } from "@/lib/delivery";

/** One ring per price tier, so the fee jumps are visible on the map. */
const RINGS = [
  { km: JUJA_TOWN_KM, fill: 0.08 },
  { km: NAIROBI_ZONE_KM, fill: 0.03 },
];

const pin = (color: string, label: string) =>
  `<span style="display:flex;align-items:center;justify-content:center;width:26px;height:26px;border-radius:50%;background:${color};color:#fff;font:700 11px/1 system-ui;border:2px solid #fff;box-shadow:0 2px 6px rgba(0,0,0,.35)">${label}</span>`;

export function DeliveryMap({
  value,
  onChange,
}: {
  value: LatLng | null;
  onChange: (point: LatLng) => void;
}) {
  const containerRef = useRef<HTMLDivElement>(null);
  const mapRef = useRef<LeafletNS.Map | null>(null);
  const markerRef = useRef<LeafletNS.Marker | null>(null);
  const lineRef = useRef<LeafletNS.Polyline | null>(null);
  const leafletRef = useRef<typeof LeafletNS | null>(null);
  const onChangeRef = useRef(onChange);

  // Leaflet handlers are bound once, so they read the latest callback from here.
  useEffect(() => {
    onChangeRef.current = onChange;
  }, [onChange]);

  const [ready, setReady] = useState(false);
  const [locating, setLocating] = useState(false);
  const [notice, setNotice] = useState<string | null>(null);

  // Draws (or moves) the drop-off pin and the line back to the shop.
  function place(point: LatLng, recenter = false) {
    const L = leafletRef.current;
    const map = mapRef.current;
    if (!L || !map) return;

    if (markerRef.current) {
      markerRef.current.setLatLng(point);
    } else {
      markerRef.current = L.marker(point, {
        draggable: true,
        icon: L.divIcon({ html: pin("#166534", "★"), className: "", iconSize: [26, 26], iconAnchor: [13, 13] }),
      })
        .addTo(map)
        .on("dragend", (event: LeafletNS.DragEndEvent) => {
          const moved = (event.target as LeafletNS.Marker).getLatLng();
          onChangeRef.current({ lat: moved.lat, lng: moved.lng });
        });
    }

    const path: [number, number][] = [
      [SHOP_LOCATION.lat, SHOP_LOCATION.lng],
      [point.lat, point.lng],
    ];
    if (lineRef.current) lineRef.current.setLatLngs(path);
    else lineRef.current = L.polyline(path, { color: "#166534", weight: 2, dashArray: "5 6", opacity: 0.7 }).addTo(map);

    if (recenter) map.setView(point, Math.max(map.getZoom(), 13));
  }

  useEffect(() => {
    let cancelled = false;

    void (async () => {
      const mod = await import("leaflet");
      const L = (mod.default ?? mod) as typeof LeafletNS;
      if (cancelled || !containerRef.current || mapRef.current) return;

      leafletRef.current = L;
      const map = L.map(containerRef.current, { center: SHOP_LOCATION, zoom: 12, scrollWheelZoom: false });
      mapRef.current = map;

      L.tileLayer("https://tile.openstreetmap.org/{z}/{x}/{y}.png", {
        maxZoom: 19,
        attribution: "© OpenStreetMap",
      }).addTo(map);

      RINGS.forEach((ring) =>
        L.circle(SHOP_LOCATION, {
          radius: ring.km * 1000,
          color: "#166534",
          weight: 1,
          opacity: 0.35,
          fillOpacity: ring.fill,
        }).addTo(map),
      );

      L.marker(SHOP_LOCATION, {
        icon: L.divIcon({ html: pin("#0f172a", "A"), className: "", iconSize: [26, 26], iconAnchor: [13, 13] }),
      })
        .addTo(map)
        .bindTooltip("Alicia Phone Place · Juja Square, Juja Town");

      map.on("click", (event: LeafletNS.LeafletMouseEvent) =>
        onChangeRef.current({ lat: event.latlng.lat, lng: event.latlng.lng }),
      );

      setReady(true);
    })();

    return () => {
      cancelled = true;
      mapRef.current?.remove();
      mapRef.current = null;
      markerRef.current = null;
      lineRef.current = null;
    };
  }, []);

  // Keep the pin in step with the value owned by the checkout form.
  useEffect(() => {
    if (!ready || !value) return;
    place(value);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [ready, value?.lat, value?.lng]);

  function locate() {
    if (!navigator.geolocation) {
      setNotice("Your browser cannot share a location. Tap the map instead.");
      return;
    }
    setLocating(true);
    setNotice(null);
    navigator.geolocation.getCurrentPosition(
      (position) => {
        setLocating(false);
        const point = { lat: position.coords.latitude, lng: position.coords.longitude };
        onChangeRef.current(point);
        place(point, true);
      },
      () => {
        setLocating(false);
        setNotice("We could not read your location. Tap your spot on the map instead.");
      },
      { enableHighAccuracy: true, timeout: 10000 },
    );
  }

  return (
    <div>
      <div className="flex flex-wrap items-center justify-between gap-3">
        <p className="text-xs text-[#0f172a]/60">Tap your delivery spot on the map, or drag the green pin.</p>
        <button
          type="button"
          onClick={locate}
          disabled={locating}
          className="border border-[#166534]/40 px-4 py-2 text-[10px] font-bold uppercase tracking-wider text-[#166534] transition-colors hover:bg-[#166534]/5 disabled:opacity-50"
        >
          {locating ? "Finding you…" : "Use my location"}
        </button>
      </div>

      <div
        ref={containerRef}
        className="mt-3 h-72 w-full border border-[#166534]/25 bg-[#eef2ec] sm:h-80"
        aria-label="Delivery location picker"
      />

      {notice && <p className="mt-2 text-xs text-amber-800">{notice}</p>}
    </div>
  );
}
