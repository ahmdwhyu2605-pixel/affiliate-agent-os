# Affiliate Agent OS

Dashboard mobile-first untuk mengelola produk, draft konten, jadwal, metrik affiliate, backup, dan bantuan AI berbasis Gemini melalui Supabase Edge Function.

## Deploy / konfigurasi
- GitHub Pages menyajikan frontend statis.
- Supabase project ref: `zcwiuvawmovkfbalgyyx`.
- Edge Function: `agent-run` (riset awal, rencana 7 hari, konsep video/storyboard; bukan renderer atau publisher).
- Tambahkan `GEMINI_API_KEY` pada Supabase Edge Function Secrets. Jangan pernah menaruh key server-side di frontend atau GitHub.
- Aktifkan **Anonymous Sign-ins** pada Supabase Auth agar sinkronisasi workspace antar refresh di perangkat yang sama dapat bekerja.
- Frontend memakai publishable key saja. Secret server-side tidak boleh dikirim ke browser.
- Sinkronisasi cloud menggunakan `public.agent_workspaces`, dengan RLS sehingga pengguna hanya bisa membaca dan mengubah workspace miliknya.
- Buka GitHub Actions untuk memastikan workflow Pages berhasil setelah commit.

## Fitur yang tersedia
- Produk manual, angle promosi, harga/komisi perkiraan.
- Draft skrip template dan hasil AI yang dapat disimpan/disalin.
- Antrean jadwal manual (belum mempublikasikan konten otomatis).
- Input metrik manual dan CTR.
- Ekspor backup JSON.
- Mode AI: riset niche (Google Search grounding bila tersedia), rencana 7 hari, konsep video.

## Batasan yang diketahui
- Tidak mengambil katalog atau komisi Shopee secara otomatis dan tidak membuat tautan affiliate milik akun.
- Tidak merender video final dan tidak mengunggah konten otomatis.
- Metrik penjualan/komisi masih diinput manual.
- Sinkronisasi cloud membutuhkan Anonymous Sign-ins aktif. Bila fitur ini belum diaktifkan, aplikasi tetap menyimpan data lokal dan status sync menampilkan error.
- Endpoint AI harus diberi autentikasi/rate limiting tambahan sebelum dipakai publik secara luas. Pembatasan CORS bukan mekanisme keamanan.

