import "jsr:@supabase/functions-js/edge-runtime.d.ts";

const allowedOrigins = new Set([
  "https://ahmdwhyu2605-pixel.github.io",
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
  let rawBody: string;
  try { rawBody = await req.text(); } catch { return respond({ ok: false, error: "Body permintaan tidak dapat dibaca." }, 400, origin); }
  if (new TextEncoder().encode(rawBody).byteLength > 1500000) return respond({ ok: false, error: "Permintaan terlalu besar." }, 413, origin);
  let body: Record<string, unknown>;
  try { body = JSON.parse(rawBody); } catch { return respond({ ok: false, error: "Body harus berupa JSON yang valid." }, 400, origin); }
  if (!body || typeof body !== "object" || Array.isArray(body)) return respond({ ok: false, error: "Format permintaan tidak valid." }, 400, origin);
  const mode = String(body.mode ?? "plan");
  const niche = String(body.niche ?? "").trim().slice(0, 160);
  const audience = String(body.audience ?? "pembeli Indonesia").trim().slice(0, 160);
  const platform = String(body.platform ?? "TikTok").trim().slice(0, 40);
  const language = String(body.language ?? "Bahasa Indonesia").trim().slice(0, 40);
  const product = String(body.product ?? "").trim().slice(0, 240);
  const productUrl = String(body.productUrl ?? "").trim().slice(0, 1200);
  const videoStyle = String(body.videoStyle ?? "Review jujur").trim().slice(0, 80);
  const videoDuration = Math.max(15, Math.min(60, Number(body.videoDuration ?? 30) || 30));
  const videoGoal = String(body.videoGoal ?? "klik produk").trim().slice(0, 80);
  const productFacts = String(body.productFacts ?? "").trim().slice(0, 2500);
  const voiceTone = String(body.voiceTone ?? "natural dan meyakinkan").trim().slice(0, 160);
  const videoCount = Math.max(1, Math.min(10, Number(body.videoCount ?? 1) || 1));
  const userInstruction = String(body.userInstruction ?? "").trim().slice(0, 2500);
  const productImages = Array.isArray(body.productImages) ? body.productImages.slice(0, 3) : [];
  const humanImage = body.humanImage && typeof body.humanImage === "object" ? body.humanImage as { mimeType?: string; data?: string } : null;
  const validImage = (image: { mimeType?: string; data?: string }) => typeof image.data === "string" && image.data.length <= 700000 && ["image/jpeg", "image/png", "image/webp"].includes(String(image.mimeType));
  if (productImages.some((image: unknown) => !image || typeof image !== "object" || !validImage(image as { mimeType?: string; data?: string })) || (humanImage && !validImage(humanImage))) return respond({ ok: false, error: "Foto referensi tidak valid atau terlalu besar. Coba foto lebih kecil." }, 400, origin);
  if (productUrl && !/^https?:\/\//i.test(productUrl)) return respond({ ok: false, error: "Link produk harus berupa URL http atau https." }, 400, origin);
  if (!["research", "plan", "video", "render"].includes(mode)) return respond({ ok: false, error: "Mode tidak dikenal." }, 400, origin);
  if (!["TikTok", "Shopee Video", "Instagram Reels", "YouTube Shorts"].includes(platform)) return respond({ ok: false, error: "Platform tidak didukung." }, 400, origin);
  if (!niche && !product) return respond({ ok: false, error: "Isi niche atau nama produk terlebih dahulu." }, 400, origin);
  if (mode === "render") {
    const renderPrompt = String(body.renderPrompt ?? "").trim().slice(0, 3000);
    const visualPrompt = `Create a polished vertical 9:16 affiliate product promo video. Product: ${product}. Product link (reference only; do not claim to have opened it): ${productUrl || "not provided"}. Verified product facts supplied by user: ${productFacts || "none supplied; do not invent product specifications, price, ratings, or performance claims"}. Audience: ${audience}. Style: ${videoStyle}. Marketing goal: ${videoGoal}. Voice tone: ${voiceTone}. Language: Indonesian. Creative direction: strong visual hook in the first 1-2 seconds, cinematic close-ups, clean lighting, smooth camera movement, tasteful composition with empty space for editor-added captions, honest advertising, no fake reviews, no fake logos or unsupported claims. ${renderPrompt}`;
    try {
      const upstream = await fetch("https://generativelanguage.googleapis.com/v1beta/interactions", {
        method: "POST",
        headers: { "Content-Type": "application/json", "x-goog-api-key": apiKey },
        body: JSON.stringify({ model: "gemini-omni-1.1-flash", input: [...productImages.map((image: { mimeType: string; data: string }) => ({ type: "image", data: image.data, mime_type: image.mimeType })), ...(humanImage ? [{ type: "image", data: humanImage.data, mime_type: humanImage.mimeType }] : []), { type: "text", text: visualPrompt }], response_format: { type: "video", aspect_ratio: "9:16" } }),
        signal: AbortSignal.timeout(150000),
      });
      const raw = await upstream.json().catch(() => ({}));
      if (!upstream.ok) {
        console.error("Gemini video request failed", upstream.status);
        const message = upstream.status === 429 ? "Kuota video AI habis atau limit tercapai. Cek kuota dan billing Google AI Studio." : upstream.status === 400 ? "Model video menolak permintaan. Coba prompt lebih sederhana atau periksa akses model." : upstream.status === 403 ? "Akses model video belum tersedia untuk API key ini atau billing belum aktif." : "Layanan render video AI gagal. Coba lagi nanti.";
        return respond({ ok: false, error: message }, upstream.status === 429 ? 429 : upstream.status === 400 ? 400 : upstream.status === 403 ? 403 : 502, origin);
      }
      const stepContent = (raw?.steps ?? []).filter((step: { type?: string }) => step.type === "model_output").flatMap((step: { content?: Array<{ type?: string; data?: string; mime_type?: string }> }) => step.content ?? []);
      const video = stepContent.find((part: { type?: string; data?: string; mime_type?: string }) => part.type === "video" && typeof part.data === "string");
      const outputVideo = raw?.output_video;
      const videoData = video?.data ?? outputVideo?.data;
      const mimeType = video?.mime_type ?? outputVideo?.mime_type ?? "video/mp4";
      if (!videoData) return respond({ ok: false, error: "Model merespons tetapi file video tidak ditemukan. Coba ulangi; jika berulang, cek respons API video." }, 502, origin);
      return respond({ ok: true, mode: "render", model: "gemini-omni-1.1-flash", mimeType, videoBase64: videoData, generated_at: new Date().toISOString(), notice: "Video AI selesai dibuat. Tinjau hasil sebelum dipakai untuk promosi; model dapat membuat detail visual yang tidak persis sama dengan produk asli." }, 200, origin);
    } catch (error) {
      const message = error instanceof DOMException && error.name === "TimeoutError" ? "Render video memerlukan waktu terlalu lama. Coba lagi nanti; jangan kirim permintaan berulang-ulang." : "Gagal menghubungi model video AI. Periksa akses Gemini API dan billing.";
      return respond({ ok: false, error: message }, 502, origin);
    }
  }
  const prompt = mode === "research"
    ? `Lakukan riset pasar affiliate Indonesia yang spesifik untuk permintaan berikut: ${niche}. Audiens ${audience}; marketplace/platform ${platform}; produk fokus ${product || "belum ditentukan"}. Gunakan Google Search grounding. Susun laporan: (1) ringkasan keputusan apakah layak diuji, (2) skor peluang 0-100 dengan confidence dan alasan terukur, (3) bukti tren dan musim/seasonality, (4) data produk terlaris/penjualan hanya bila ada sumber publik yang benar-benar memuat angka dan periode, (5) harga, rating, ulasan, komisi hanya jika didukung sumber, (6) persaingan dan diferensiasi konten, (7) 3-5 produk/kata kunci pembanding, (8) estimasi potensi komisi dengan rumus dan asumsi eksplisit bila data input cukup, (9) risiko stok, kualitas, retur, klaim iklan, dan persaingan, (10) rencana eksperimen 5 video dengan angle berbeda dan metrik evaluasi, (11) daftar sumber URL dan tanggal data. Pisahkan dengan jelas DATA TERVERIFIKASI, ESTIMASI, dan DATA TIDAK TERSEDIA. Jangan mengaku memiliki akses ke dashboard privat Shopee/TikTok atau angka penjualan internal. Jika data penjualan tidak tersedia secara publik, jelaskan cara pengguna mengambilnya dari menu Produk Terlaris/Trending atau laporan affiliate dan minta CSV/screenshot bila diperlukan. Jangan mengarang angka, komisi, tren, sumber, atau tautan. Jawab dalam ${language}.`
    : mode === "video"
    ? `Buat PAKET BATCH berisi TEPAT ${videoCount} KONSEP VIDEO AFFILIATE YANG BERBEDA untuk ${platform}. Produk ${product}; link referensi ${productUrl || "tidak diberikan"}; target ${audience}; gaya ${videoStyle}; durasi tiap video ${videoDuration} detik; tujuan ${videoGoal}; gaya suara ${voiceTone}; fakta produk ${productFacts || "belum diberikan"}; instruksi tambahan pengguna: ${userInstruction || "tidak ada"}. Gunakan foto referensi terlampir untuk memahami bentuk/warna produk dan penampilan model. Jika ada foto manusia, jadikan referensi visual untuk konsistensi penampilan. Jangan mengaku telah membuka link bila isi halaman tidak tersedia. Jangan mengarang harga, rating, fitur, testimoni, atau hasil. Tandai yang perlu diverifikasi dengan [CEK FAKTA]. Beri nomor KONSEP 1 sampai ${videoCount}; setiap konsep wajib punya angle, hook, alur cerita, skrip voice-over kata demi kata dengan timestamp, storyboard per adegan (durasi, visual, kamera, teks layar, VO, transisi/SFX), prompt visual vertikal 9:16 yang memakai foto referensi dan menjaga produk/model tetap konsisten, subtitle siap tempel, caption, 5-8 hashtag, CTA jujur. Variasikan angle secara nyata (problem-solusi, demo, storytelling, daftar manfaat, objection handling) tanpa mengulang skrip. Sesuaikan platform: TikTok hook cepat; Shopee Video demo produk dan CTA ke produk; Instagram Reels visual rapi; YouTube Shorts retensi dan payoff. Jangan menjanjikan viral atau mengaku MP4 sudah dibuat.`
    : `Buat rencana affiliate 7 hari untuk niche ${niche || product}, audiens ${audience}, platform ${platform}, produk ${product || "belum dipilih"}. Jawab dalam ${language}: prioritas riset, kriteria skor produk, 3 konsep konten, jadwal eksperimen 7 hari, metrik evaluasi, dan hal yang perlu diverifikasi. Jangan mengarang data pasar, komisi, atau penjualan.`;
  try {
    const upstream = await fetch("https://generativelanguage.googleapis.com/v1beta/models/gemini-3.8-flash:generateContent", {
      method: "POST",
      headers: { "Content-Type": "application/json", "x-goog-api-key": apiKey },
      body: JSON.stringify({ contents: [{ role: "user", parts: [{ text: prompt }, ...(mode === "video" ? [...productImages.map((image: { mimeType: string; data: string }) => ({ inline_data: { mime_type: image.mimeType, data: image.data } })), ...(humanImage ? [{ inline_data: { mime_type: humanImage.mimeType, data: humanImage.data } }] : [])] : [])] }], ...(mode === "research" ? { tools: [{ google_search: {} }] } : {}), generationConfig: { temperature: mode === "video" ? 0.8 : 0.45, maxOutputTokens: mode === "video" ? 10000 : 3000 } }),
      signal: AbortSignal.timeout(25000),
    });
    const raw = await upstream.json().catch(() => ({}));
    if (!upstream.ok) {
      const providerStatus = upstream.status;
      console.error("Gemini request failed", providerStatus);
      const message = providerStatus === 429 ? "Batas penggunaan AI tercapai. Tunggu sebentar lalu coba lagi." : providerStatus === 400 ? "Permintaan AI ditolak. Periksa input dan konfigurasi model." : "Layanan AI sedang bermasalah. Coba lagi nanti.";
      return respond({ ok: false, error: message }, providerStatus === 429 ? 429 : providerStatus === 400 ? 400 : 502, origin);
    }
    const candidate = raw?.candidates?.[0];
    const resultText = (candidate?.content?.parts ?? []).map((part: { text?: string }) => part.text ?? "").join("\n").trim();
    const sources = (candidate?.groundingMetadata?.groundingChunks ?? []).map((chunk: { web?: { uri?: string; title?: string } }) => chunk.web).filter((web: { uri?: string } | undefined) => typeof web?.uri === "string" && /^https?:\/\//.test(web.uri)).map((web: { uri: string; title?: string }) => ({ url: web.uri, title: web.title ?? web.uri }));
    if (!resultText) return respond({ ok: false, error: "AI tidak mengembalikan teks. Coba ubah permintaan." }, 502, origin);
    const savedRun = await fetch(supabaseUrl + "/rest/v1/agent_runs", {
      method: "POST",
      headers: { apikey: publishableKey, Authorization: "Bearer " + bearer, "Content-Type": "application/json", Prefer: "return=minimal" },
      body: JSON.stringify({ user_id: authenticatedUser.id, mode, niche: niche || null, audience, platform, product: product || null, request_json: { mode, niche, audience, platform, product, productUrl, videoStyle, videoDuration, videoGoal, productFacts, voiceTone, videoCount, userInstruction, productImageCount: productImages.length, hasHumanReference: !!humanImage, language }, result_text: resultText, sources, status: "completed", completed_at: new Date().toISOString() }),
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
