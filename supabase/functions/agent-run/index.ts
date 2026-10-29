import "jsr:@supabase/functions-js/edge-runtime.d.ts";

const allowedOrigins = new Set([
  "https://ahmdwhyu2605-pixel.github.io",
  "http://localhost:3000",
  "http://127.0.0.1:5500",
]);

function corsHeaders(origin: string | null) {
  const allowOrigin = origin && allowedOrigins.has(origin) ? origin : "https://ahmdwhyu2605-pixel.github.io";
  return {
    "Access-Control-Allow-Origin": allowOrigin,
    "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
    "Access-Control-Allow-Methods": "POST, OPTIONS",
    "Vary": "Origin",
    "Content-Type": "application/json; charset=utf-8",
    "Cache-Control": "no-store",
  };
}
function respond(data: unknown, status = 200, origin: string | null = null) {
  return new Response(JSON.stringify(data), { status, headers: corsHeaders(origin) });
}
Deno.serve(async (req: Request) => {
  const origin = req.headers.get("origin");
  if (req.method === "OPTIONS") return new Response(null, { status: 204, headers: corsHeaders(origin) });
  if (origin && !allowedOrigins.has(origin)) return respond({ ok: false, error: "Origin tidak diizinkan." }, 403, origin);
  if (req.method !== "POST") return respond({ ok: false, error: "Gunakan metode POST." }, 405, origin);
  const apiKey = Deno.env.get("GEMINI_API_KEY");
  if (!apiKey) return respond({ ok: false, configured: false, error: "GEMINI_API_KEY belum dipasang pada Supabase Edge Function Secrets." }, 503, origin);
  const supabaseUrl = "https://zcwiuvawmovkfbalgyyx.supabase.co";
  const publishableKey = Deno.env.get("SUPABASE_PUBLISHABLE_KEY") || "sb_publishable_t0EIetmfeeU_ZjlMVVv-Kg_dDYjFubn";
  const authorization = req.headers.get("authorization") || "";
  const bearer = authorization.match(/^Bearer\s+(.+)$/i)?.[1];
  if (!publishableKey || !bearer || bearer === publishableKey) return respond({ ok: false, error: "Sesi pengguna tidak valid. Muat ulang aplikasi dan coba lagi." }, 401, origin);
  let authenticatedUser: { id?: string };
  try {
    const authResponse = await fetch(supabaseUrl + "/auth/v1/user", { headers: { apikey: publishableKey, Authorization: "Bearer " + bearer }, signal: AbortSignal.timeout(8000) });
    if (!authResponse.ok) return respond({ ok: false, error: "Sesi pengguna kedaluwarsa. Muat ulang aplikasi dan coba lagi." }, 401, origin);
    authenticatedUser = await authResponse.json();
    if (!authenticatedUser.id) return respond({ ok: false, error: "Identitas pengguna tidak ditemukan." }, 401, origin);
  } catch { return respond({ ok: false, error: "Tidak dapat memverifikasi sesi pengguna." }, 502, origin); }
  const length = Number(req.headers.get("content-length") || 0);
  if (length > 12000) return respond({ ok: false, error: "Permintaan terlalu besar." }, 413, origin);
  let body: Record<string, unknown>;
  try { body = await req.json(); } catch { return respond({ ok: false, error: "Body harus berupa JSON yang valid." }, 400, origin); }
  if (!body || typeof body !== "object" || Array.isArray(body)) return respond({ ok: false, error: "Format permintaan tidak valid." }, 400, origin);
  const mode = String(body.mode ?? "plan");
  const niche = String(body.niche ?? "").trim().slice(0, 160);
  const audience = String(body.audience ?? "pembeli Indonesia").trim().slice(0, 160);
  const platform = String(body.platform ?? "TikTok").trim().slice(0, 40);
  const language = String(body.language ?? "Bahasa Indonesia").trim().slice(0, 40);
  const product = String(body.product ?? "").trim().slice(0, 240);
  if (!["research", "plan", "video"].includes(mode)) return respond({ ok: false, error: "Mode tidak dikenal." }, 400, origin);
  if (!["TikTok", "Instagram Reels", "YouTube Shorts"].includes(platform)) return respond({ ok: false, error: "Platform tidak didukung." }, 400, origin);
  if (!niche && !product) return respond({ ok: false, error: "Isi niche atau nama produk terlebih dahulu." }, 400, origin);
  const prompt = mode === "research"
    ? `Riset awal affiliate Indonesia untuk niche ${niche}, audiens ${audience}. Gunakan Google Search grounding bila tersedia. Beri kandidat kategori produk, alasan, ide konten, query pencarian, sumber URL yang benar-benar ditemukan, dan hal yang wajib diverifikasi. Jangan mengarang harga, komisi, penjualan, atau tautan affiliate. Jawab dalam ${language}.`
    : mode === "video"
    ? `Buat paket konsep video affiliate pendek untuk ${platform}. Niche ${niche || "sesuai produk"}; audiens ${audience}; produk ${product || "belum ditentukan"}. Jawab dalam ${language}: judul, hook 0-3 detik, storyboard tiap adegan dan durasi, narasi, subtitle, CTA, caption, 5 hashtag, dan daftar aset yang perlu dibuat. Jangan mengarang fitur/harga/hasil produk. Tandai klaim yang harus diverifikasi. Jangan mengaku video telah dirender atau diunggah.`
    : `Buat rencana affiliate 7 hari untuk niche ${niche || product}, audiens ${audience}, platform ${platform}, produk ${product || "belum dipilih"}. Jawab dalam ${language}: prioritas riset, kriteria skor produk, 3 konsep konten, jadwal eksperimen 7 hari, metrik evaluasi, dan hal yang perlu diverifikasi. Jangan mengarang data pasar, komisi, atau penjualan.`;
  try {
    const upstream = await fetch("https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent", {
      method: "POST",
      headers: { "Content-Type": "application/json", "x-goog-api-key": apiKey },
      body: JSON.stringify({ contents: [{ role: "user", parts: [{ text: prompt }] }], ...(mode === "research" ? { tools: [{ google_search: {} }] } : {}), generationConfig: { temperature: 0.45, maxOutputTokens: 3000 } }),
      signal: AbortSignal.timeout(25000),
    });
    const raw = await upstream.json().catch(() => ({}));
    if (!upstream.ok) {
      const providerStatus = upstream.status;
      const message = typeof raw?.error?.message === "string" ? raw.error.message : "Layanan AI mengembalikan error.";
      return respond({ ok: false, error: message, provider_status: providerStatus }, providerStatus === 429 ? 429 : providerStatus === 400 ? 400 : 502, origin);
    }
    const candidate = raw?.candidates?.[0];
    const resultText = (candidate?.content?.parts ?? []).map((part: { text?: string }) => part.text ?? "").join("\n").trim();
    const sources = (candidate?.groundingMetadata?.groundingChunks ?? []).map((chunk: { web?: { uri?: string; title?: string } }) => chunk.web).filter((web: { uri?: string } | undefined) => typeof web?.uri === "string" && /^https?:\/\//.test(web.uri)).map((web: { uri: string; title?: string }) => ({ url: web.uri, title: web.title ?? web.uri }));
    if (!resultText) return respond({ ok: false, error: "AI tidak mengembalikan teks. Coba ubah permintaan." }, 502, origin);
    const savedRun = await fetch(supabaseUrl + "/rest/v1/agent_runs", {
      method: "POST",
      headers: { apikey: publishableKey, Authorization: "Bearer " + bearer, "Content-Type": "application/json", Prefer: "return=minimal" },
      body: JSON.stringify({ user_id: authenticatedUser.id, mode, niche: niche || null, audience, platform, product: product || null, request_json: { mode, niche, audience, platform, product, language }, result_text: resultText, sources, status: "completed", completed_at: new Date().toISOString() }),
      signal: AbortSignal.timeout(8000),
    });
    if (!savedRun.ok) {
      const detail = await savedRun.text().catch(() => "");
      console.error("Failed to save agent run", savedRun.status, detail.slice(0, 300));
      return respond({ ok: false, error: "AI berhasil membuat hasil, tetapi gagal menyimpan riwayat ke database. Periksa kebijakan RLS agent_runs." }, 502, origin);
    }
    return respond({ ok: true, configured: true, mode, text: resultText, sources, generated_at: new Date().toISOString(), saved: true, notice: "Hasil AI dan riwayatnya tersimpan. Hasil tetap perlu diverifikasi; tautan affiliate, render video final, dan publikasi otomatis memerlukan integrasi tambahan." }, 200, origin);
  } catch (error) {
    const message = error instanceof DOMException && error.name === "TimeoutError" ? "Permintaan ke AI melewati batas waktu. Coba lagi." : "Gagal menghubungi layanan AI. Periksa konfigurasi lalu coba lagi.";
    return respond({ ok: false, error: message }, 502, origin);
  }
});
