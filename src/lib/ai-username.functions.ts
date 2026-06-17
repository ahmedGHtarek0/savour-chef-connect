import { createServerFn } from "@tanstack/react-start";

export const generateUsername = createServerFn({ method: "POST" })
  .inputValidator((d: { hint?: string }) => d)
  .handler(async ({ data }) => {
    const key = process.env.LOVABLE_API_KEY;
    if (!key) throw new Error("AI service not configured");
    const prompt =
      "Generate ONE short, friendly, lowercase username for a food delivery app user. " +
      "Rules: 4-14 characters, letters/numbers/underscores only, no spaces, must NOT start with a number, must be unique-feeling. " +
      (data.hint ? `Inspired by: "${data.hint}". ` : "") +
      'Reply ONLY with compact JSON: {"username": "..."}';
    const resp = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: { "Content-Type": "application/json", "Lovable-API-Key": key },
      body: JSON.stringify({
        model: "google/gemini-2.5-flash-lite",
        messages: [{ role: "user", content: prompt }],
        response_format: { type: "json_object" },
      }),
    });
    if (!resp.ok) throw new Error(`AI failed: ${resp.status}`);
    const json = await resp.json();
    const text: string = json?.choices?.[0]?.message?.content ?? "{}";
    let parsed: { username?: string } = {};
    try { parsed = JSON.parse(text); } catch {}
    let username = (parsed.username ?? "").toLowerCase().replace(/[^a-z0-9_]/g, "");
    if (!username || /^\d/.test(username)) username = "chef_" + Math.random().toString(36).slice(2, 8);
    if (username.length < 4) username = username + Math.random().toString(36).slice(2, 6);
    if (username.length > 14) username = username.slice(0, 14);
    // append short suffix to reduce collision chance
    const suffix = Math.random().toString(36).slice(2, 5);
    const candidate = (username.length + suffix.length + 1 <= 14)
      ? `${username}_${suffix}`
      : username;
    return { username: candidate };
  });