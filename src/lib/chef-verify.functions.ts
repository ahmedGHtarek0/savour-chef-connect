import { createServerFn } from "@tanstack/react-start";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";

// Find the closest active zone within its radius (Haversine).
export const resolveZone = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: { lat: number; lng: number }) => d)
  .handler(async ({ data, context }) => {
    const { data: zones, error } = await context.supabase
      .from("zones")
      .select("id,name,center_lat,center_lng,radius_km,active")
      .eq("active", true);
    if (error) throw error;
    const R = 6371;
    const toRad = (x: number) => (x * Math.PI) / 180;
    let best: { id: string; name: string; distance_km: number; inside: boolean } | null = null;
    for (const z of zones ?? []) {
      const dLat = toRad(Number(z.center_lat) - data.lat);
      const dLng = toRad(Number(z.center_lng) - data.lng);
      const a =
        Math.sin(dLat / 2) ** 2 +
        Math.cos(toRad(data.lat)) * Math.cos(toRad(Number(z.center_lat))) * Math.sin(dLng / 2) ** 2;
      const dist = 2 * R * Math.asin(Math.sqrt(a));
      if (!best || dist < best.distance_km) {
        best = { id: z.id, name: z.name, distance_km: dist, inside: dist <= Number(z.radius_km) };
      }
    }
    return { zone: best };
  });

// Run a best-effort Lovable AI vision check on an uploaded national ID image (base64 data URL).
export const aiIdCheck = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: { frontDataUrl: string; backDataUrl?: string }) => d)
  .handler(async ({ data }) => {
    const key = process.env.LOVABLE_API_KEY;
    if (!key) throw new Error("AI service not configured");
    const userContent: any[] = [
      {
        type: "text",
        text:
          "You are verifying a national ID document. Look at the image(s) and reply ONLY with compact JSON: " +
          '{"is_id": boolean, "side_detected": "front" | "back" | "unknown", "confidence": number (0-1), "name": string|null, "id_number": string|null, "issues": string[]}. ' +
          "Do not include any prose.",
      },
      { type: "image_url", image_url: { url: data.frontDataUrl } },
    ];
    if (data.backDataUrl) userContent.push({ type: "image_url", image_url: { url: data.backDataUrl } });

    const resp = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: { "Content-Type": "application/json", "Lovable-API-Key": key },
      body: JSON.stringify({
        model: "google/gemini-2.5-flash",
        messages: [{ role: "user", content: userContent }],
        response_format: { type: "json_object" },
      }),
    });
    if (!resp.ok) {
      const t = await resp.text();
      throw new Error(`AI check failed: ${resp.status} ${t.slice(0, 200)}`);
    }
    const json = await resp.json();
    const text: string = json?.choices?.[0]?.message?.content ?? "{}";
    let parsed: any;
    try { parsed = JSON.parse(text); } catch { parsed = { is_id: false, issues: ["unparseable"] }; }
    return { result: parsed };
  });

// Reverse-geocode lat/lng to a human-readable street address using the Google Maps connector.
export const reverseGeocode = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: { lat: number; lng: number }) => d)
  .handler(async ({ data }) => {
    const lovableKey = process.env.LOVABLE_API_KEY;
    const gmapsKey = process.env.GOOGLE_MAPS_API_KEY;
    if (!lovableKey || !gmapsKey) return { address: null as string | null };
    const url = `https://connector-gateway.lovable.dev/google_maps/maps/api/geocode/json?latlng=${data.lat},${data.lng}&language=en`;
    const resp = await fetch(url, {
      headers: {
        Authorization: `Bearer ${lovableKey}`,
        "X-Connection-Api-Key": gmapsKey,
      },
    });
    if (!resp.ok) return { address: null };
    const json = await resp.json();
    const address = json?.results?.[0]?.formatted_address ?? null;
    return { address };
  });

// AI recommendations for a chef based on their menu, orders, and reviews.
export const chefAiRecommendations = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const key = process.env.LOVABLE_API_KEY;
    if (!key) throw new Error("AI service not configured");
    const { supabase, userId } = context;

    const [{ data: items }, { data: orderItems }, { data: reviews }] = await Promise.all([
      supabase.from("chef_items").select("price, available, unit_mode, min_qty, max_qty, items(name)").eq("chef_id", userId),
      supabase.from("order_items").select("qty, unit_price, orders!inner(status, created_at)").eq("chef_id", userId).limit(200),
      supabase.from("reviews").select("rating, comment, created_at").eq("chef_id", userId).limit(50),
    ]);

    const summary = {
      menu_size: items?.length ?? 0,
      menu: (items ?? []).slice(0, 30),
      total_orders: orderItems?.length ?? 0,
      recent_revenue: (orderItems ?? []).reduce((s: number, o: any) => s + Number(o.unit_price) * Number(o.qty), 0),
      avg_rating: reviews && reviews.length
        ? reviews.reduce((s: number, r: any) => s + Number(r.rating), 0) / reviews.length
        : null,
      review_samples: (reviews ?? []).slice(0, 8).map((r: any) => ({ rating: r.rating, comment: r.comment })),
    };

    const resp = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: { "Content-Type": "application/json", "Lovable-API-Key": key },
      body: JSON.stringify({
        model: "google/gemini-2.5-flash",
        messages: [
          { role: "system", content: "You are a friendly business coach for a home-kitchen chef. Return ONLY JSON {\"insights\": string[], \"actions\": string[], \"menu_ideas\": string[]} with 3-5 items each, concise and concrete." },
          { role: "user", content: "Here is my data: " + JSON.stringify(summary) },
        ],
        response_format: { type: "json_object" },
      }),
    });
    if (!resp.ok) throw new Error(`AI failed: ${resp.status}`);
    const json = await resp.json();
    const text: string = json?.choices?.[0]?.message?.content ?? "{}";
    try { return { recommendations: JSON.parse(text), summary }; }
    catch { return { recommendations: { insights: [], actions: [], menu_ideas: [] }, summary }; }
  });