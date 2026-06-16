import { useEffect, useRef } from "react";

declare global { interface Window { google: any; __gmapsInit?: () => void; __gmapsLoading?: Promise<void> } }

function loadMapsScript(): Promise<void> {
  if (typeof window === "undefined") return Promise.resolve();
  if (window.google?.maps) return Promise.resolve();
  if (window.__gmapsLoading) return window.__gmapsLoading;
  window.__gmapsLoading = new Promise<void>((resolve) => {
    window.__gmapsInit = () => resolve();
    const s = document.createElement("script");
    const key = import.meta.env.VITE_LOVABLE_CONNECTOR_GOOGLE_MAPS_BROWSER_KEY;
    const channel = import.meta.env.VITE_LOVABLE_CONNECTOR_GOOGLE_MAPS_TRACKING_ID;
    s.src = `https://maps.googleapis.com/maps/api/js?key=${key}&loading=async&callback=__gmapsInit&channel=${channel}`;
    s.async = true;
    document.head.appendChild(s);
  });
  return window.__gmapsLoading;
}

export type ZoneMarker = { id: string; name: string; lat: number; lng: number; radiusKm: number };

export function GoogleMap({ markers = [], center = { lat: 30.0444, lng: 31.2357 }, zoom = 11, onMapClick }: {
  markers?: ZoneMarker[];
  center?: { lat: number; lng: number };
  zoom?: number;
  onMapClick?: (lat: number, lng: number) => void;
}) {
  const ref = useRef<HTMLDivElement>(null);
  const mapRef = useRef<any>(null);
  const overlaysRef = useRef<any[]>([]);

  useEffect(() => {
    let cancelled = false;
    loadMapsScript().then(() => {
      if (cancelled || !ref.current) return;
      mapRef.current = new window.google.maps.Map(ref.current, {
        center, zoom, disableDefaultUI: false, styles: [],
      });
      if (onMapClick) {
        mapRef.current.addListener("click", (e: any) => onMapClick(e.latLng.lat(), e.latLng.lng()));
      }
    });
    return () => { cancelled = true; };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    if (!mapRef.current || !window.google) return;
    overlaysRef.current.forEach(o => o.setMap(null));
    overlaysRef.current = [];
    markers.forEach(m => {
      const marker = new window.google.maps.Marker({ position: { lat: m.lat, lng: m.lng }, map: mapRef.current, title: m.name });
      const circle = new window.google.maps.Circle({
        center: { lat: m.lat, lng: m.lng }, radius: m.radiusKm * 1000, map: mapRef.current,
        fillColor: "#e8842a", fillOpacity: 0.18, strokeColor: "#c45a2a", strokeOpacity: 0.7, strokeWeight: 2,
      });
      overlaysRef.current.push(marker, circle);
    });
  }, [markers]);

  return <div ref={ref} className="w-full h-[520px] rounded-xl border border-border overflow-hidden" />;
}