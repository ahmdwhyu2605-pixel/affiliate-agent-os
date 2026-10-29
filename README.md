# Affiliate Agent OS

Dashboard mobile untuk mengelola produk affiliate, draft konten, jadwal, analitik, backup, dan bantuan AI.

## Fitur yang tersedia
- Produk, draft template, antrean jadwal, dan catatan performa tersimpan lokal.
- Ekspor backup JSON.
- Login/daftar email-password Supabase untuk menyimpan satu workspace JSON per akun ke tabel `agent_workspaces`.
- AI Agent memanggil Supabase Edge Function `agent-run` untuk riset, rencana 7 hari, dan paket konsep video.
- Hasil AI dapat disalin atau disimpan ke Studio Konten.

## Deployment
GitHub Pages diterbitkan oleh workflow `.github/workflows/pages.yml` pada push ke `main`.
Edge Function diterbitkan oleh workflow `.github/workflows/deploy-supabase-function.yml` jika secret GitHub berikut tersedia: `SUPABASE_ACCESS_TOKEN`, `SUPABASE_PROJECT_REF`, `GEMINI_API_KEY`.

## Supabase
- URL project: `https://zcwiuvawmovkfbalgyyx.supabase.co`
- Tabel sinkronisasi: `public.agent_workspaces`.
- RLS wajib membatasi SELECT/INSERT/UPDATE pada `auth.uid() = user_id`.
- Secret Gemini hanya disimpan di Supabase Edge Function Secrets, bukan di GitHub Pages atau JavaScript publik.

## Batasan penting
Sinkronisasi menyimpan seluruh workspace aplikasi sebagai satu dokumen JSON per akun; fitur ini bukan sinkronisasi tabel terpisah. AI menghasilkan teks/riset/storyboard, bukan video final, tautan affiliate resmi, auto-publish, atau data komisi aktual. Informasi produk dan klaim AI tetap harus diverifikasi.
