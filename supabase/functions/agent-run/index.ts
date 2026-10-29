// Supabase Edge Function: AI affiliate research + content planning.
// Required server-side secret: GEMINI_API_KEY. Never put this key in the browser.
import { serve } from "https://deno.land/std@0.224.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });
  if (req.method !== "POST") return json({ error: "Use POST." }, 405);
  const apiKey = Deno.env.get("GEMINI_API_KEY");
  if (!apiKey) return json({ error: "Server belum dikonfigurasi: GEMINI_API_KEY belum dipasang sebagai Supabase secret." }, 503);

  let body: Record<string, unknown>;
  try { body = await req.json(); } catch { return json({ error: "Body harus JSON." }, 400); }
  const mode = String(body.mode ?? "plan");
  const niche = String(body.niche ?? "").trim().slice(0, 160);
  const audience = String(body.audience ?? "pembeli Indonesia").trim().slice(0, 160);
  const platform = String(body.platform ?? "TikTok").trim().slice(0, 40);
  const language = String(body.language ?? "Bahasa Indonesia").trim().slice(0, 40);
  const product = String(body.product ?? "").trim().slice(0, 240);
  if (!niche && !product) return json({ error: "Isi niche atau nama produk dulu." }, 400);

  const task = mode === "video"
    ? `Buat paket produksi video affiliate pendek untuk platform ${platform}. Niche: ${niche || "sesuai produk"}; audiens: ${audience}; produk: ${product || "beri ide produk yang harus diverifikasi manusia"}. Output dalam ${language}. Sertakan: judul, hook 0-3 detik, storyboard per adegan dengan durasi dan visual, narasi voice-over, teks subtitle, CTA, caption, 5 hashtag relevan, dan daftar aset video yang perlu dibuat. Jangan mengarang fitur/harga/hasil produk. Tandai fakta yang perlu diverifikasi. Jangan mengaku video sudah dirender atau diunggah.`
    : mode === "research"
    ? `Buat riset awal niche affiliate Indonesia untuk niche ${niche}; audiens ${audience}. Gunakan Google Search grounding jika tersedia. Cari kategori produk dan contoh kandidat yang bisa diperiksa di Shopee. Berikan alasan permintaan, kisaran harga hanya jika ada sumber, potensi konten, risiko, dan query pencarian untuk validasi. Sertakan URL sumber yang benar-benar ditemukan. Jangan mengarang angka penjualan, komisi, tautan affiliate, atau ketersediaan produk. Tandai hal yang belum bisa diverifikasi. Output dalam ${language}.`
    : `Buat rencana kerja affiliate untuk niche ${niche || "sesuai produk"}, audiens ${audience}, platform ${platform}, produk ${product || "belum dipilih"}. Dalam ${language}, keluarkan rencana praktis: prioritas riset, kriteria skor produk, 3 konsep konten, jadwal eksperimen 7 hari, metrik evaluasi, dan hal yang perlu diverifikasi. Jangan mengarang data pasar, komisi, atau penjualan.`;

  const geminiBody = {
    contents: [{ role: "user", parts: [{ text: task }] }],
    tools: mode === "research" ? [{ google_search: {} }] : undefined,
    generationConfig: { temperature: 0.55, maxOutputTokens: 3000 },
  };
  let upstream: Response;
  try {
    upstream = await fetch("https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent", {
      method: "POST",
      headers: { "Content-Type": "application/json", "x-goog-api-key": apiKey },
      body: JSON.stringify(geminiBody),
    });
  } catch {
    return json({ error: "Tidak bisa menghubungi layanan AI. Coba lagi nanti." }, 502);
  }
  const raw = await upstream.json().catch(() => ({}));
  if (!upstream.ok) {
    const message = typeof raw?.error?.message === "string" ? raw.error.message : "Layanan AI mengembalikan error.";
    return json({ error: message, provider_status: upstream.status }, upstream.status === 429 ? 429 : 502);
  }
  const candidate = raw?.candidates?.[0];
  const text = (candidate?.content?.parts ?? []).map((p: { text?: string }) => p.text ?? "").join("\n").trim();
  const sources = candidate?.groundingMetadata?.groundingChunks?.map((chunk: { web?: { uri?: string; title?: string } }) => chunk.web).filter((web: { uri?: string } | undefined) => web?.uri).map((web: { uri?: string; title?: string }) => ({ url: web.uri, title: web.title ?? web.uri })) ?? [];
  if (!text) return json({ error: "AI tidak mengembalikan teks. Coba ubah permintaan." }, 502);
  return json({ ok: true, mode, text, sources, generated_at: new Date().toISOString(), notice: "Riset dan saran AI perlu diverifikasi. Fungsi ini tidak membuat video final, tidak membuat tautan affiliate, dan tidak mengunggah konten." });
});

function json(data: unknown, status = 200) {
  return new Response(JSON.stringify(data), { status, headers: { ...corsHeaders, "Content-Type": "application/json" } });
}
