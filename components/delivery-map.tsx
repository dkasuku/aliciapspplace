"use client";

import { useEffect, useRef, useState } from "react";
import type * as LeafletNS from "leaflet";
import "leaflet/dist/leaflet.css";
import { JUJA_TOWN_KM, NAIROBI_ZONE_KM, OUTSKIRTS_KM, SHOP_LOCATION, type LatLng } from "@/lib/delivery";

/** One ring per price tier, so the fee jumps are visible on the map. */
const RINGS = [
  { km: JUJA_TOWN_KM, fill: 0.08 },
  { km: NAIROBI_ZONE_KM, fill: 0.03 },
  { km: OUTSKIRTS_KM, fill: 0.015 },
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
  const [query, setQuery] = useState("");
  const [searching, setSearching] = useState(false);
  const [results, setResults] = useState<Array<{ label: string; lat: number; lng: number }>>([]);

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

  /** Looks a place up by name so people who cannot share GPS can still order. */
  async function search(event: React.FormEvent) {
    event.preventDefault();
    const term = query.trim();
    if (!term) return;
    setSearching(true);
    setNotice(null);
    setResults([]);
    try {
      const url = new URL("https://nominatim.openstreetmap.org/search");
      url.searchParams.set("q", term);
      url.searchParams.set("format", "jsonv2");
      url.searchParams.set("limit", "6");
      url.searchParams.set("countrycodes", "ke");
      const response = await fetch(url, { headers: { Accept: "application/json" } });
      const found = (await response.json()) as Array<{ display_name: string; lat: string; lon: string }>;
      if (!found.length) {
        setNotice(`Nothing found for “${term}”. Try a landmark, estate or town name.`);
        return;
      }
      setResults(found.map((r) => ({ label: r.display_name, lat: Number(r.lat), lng: Number(r.lon) })));
    } catch {
      setNotice("Could not search right now. Tap your spot on the map instead.");
    } finally {
      setSearching(false);
    }
  }

  function choose(result: { label: string; lat: number; lng: number }) {
    const point = { lat: result.lat, lng: result.lng };
    onChangeRef.current(point);
    place(point, true);
    setResults([]);
    setQuery(result.label.split(",")[0]);
  }

  return (
    <div>
      <form onSubmit={search} className="mb-3 flex gap-2">
        <div className="relative min-w-0 flex-1">
          <input
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            placeholder="Search a place — estate, landmark or town"
            aria-label="Search for your delivery location"
            className="w-full border border-[#166534]/30 bg-white px-4 py-3 text-sm text-[#0f172a] focus:border-[#166534] focus:outline-none"
          />
          {results.length > 0 && (
            <ul className="absolute z-[1000] mt-1 max-h-60 w-full overflow-y-auto border border-[#166534]/25 bg-white shadow-lg">
              {results.map((result, index) => (
                <li key={`${result.lat}-${result.lng}-${index}`}>
                  <button
                    type="button"
                    onClick={() => choose(result)}
                    className="block w-full px-4 py-2.5 text-left text-xs leading-5 text-[#0f172a] hover:bg-[#f0fdf4]"
                  >
                    {result.label}
                  </button>
                </li>
              ))}
            </ul>
          )}
        </div>
        <button
          type="submit"
          disabled={searching || !query.trim()}
          className="shrink-0 bg-[#166534] px-5 text-[10px] font-bold uppercase tracking-wider text-white transition-colors hover:bg-[#14532d] disabled:opacity-50"
        >
          {searching ? "…" : "Search"}
        </button>
      </form>

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
