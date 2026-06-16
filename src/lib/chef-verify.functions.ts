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