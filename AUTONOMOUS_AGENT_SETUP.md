# Affiliate Agent OS — Backend & Automation Status

## Current architecture
- GitHub Pages hosts the mobile-first static dashboard.
- Supabase Auth protects the user workspace; user-owned data uses Row Level Security.
- Supabase Edge Function `agent-run` calls Gemini using the server-side `GEMINI_API_KEY`.
- AI modes: grounded market research, 7-day plan, and a batch of distinct video scripts/storyboards.
- Video rendering uses Gemini Omni Flash through the Gemini Interactions API. The dashboard can request separate MP4 renders in sequence and offers each completed file for download. Rendering requires the API key to have model access and any required billing/quota.

## Secure configuration
- Never put `GEMINI_API_KEY`, a Supabase service-role key, or other private credentials in `app.js`, `index.html`, GitHub Pages, or chat.
- GitHub Actions deploys `supabase/functions/agent-run/index.ts` using repository secrets `SUPABASE_ACCESS_TOKEN`, `SUPABASE_PROJECT_REF`, and `GEMINI_API_KEY`. The workflow validates these secrets before deployment.
- The Edge Function has JWT verification disabled at the gateway because it performs its own server-side validation of the user's bearer session against Supabase Auth. Do not remove that handler-side validation.
- Database tables and policies are defined in `supabase_schema.sql`. User records are protected with RLS.
- Email verification can be resent from the sign-in screen. Google OAuth and SMS OTP still depend on the corresponding providers and credentials being configured in Supabase Auth.

## How to use the AI workflow
1. Sign in to the dashboard.
2. Open **Generate Video AI** and enter a product name and product URL.
3. Optionally attach up to three product images and one human/model reference image. Use photos you have rights to use.
4. Choose platform, style, duration, target audience, and number of concepts; add accurate product facts and custom instructions.
5. Generate the scripts/storyboards, review claims, then request a batch of separate MP4 renders. The app will keep completed files available if a later render in the batch fails.
6. Download each MP4 to the phone and inspect it before publishing.

## Important limits
- Product URLs are passed as context; the AI does not necessarily access a private marketplace page or verify the listing.
- The AI must not invent product specs, price, sales, ratings, commissions, or reviews. Verify these against the actual seller/affiliate dashboard.
- An official Shopee affiliate API/feed and authorization are required for verified commission/product data and creating affiliate links automatically.
- Automatic publishing and scheduled posting require official platform APIs, app registration, account authorization, and platform approval. This dashboard does not bypass platform rules or scrape private account sessions.
- The MP4 renderer uses model quota and can incur charges. Each selected video is a separate generation request; a batch may take several minutes and may stop partway if quota or provider access fails.
- A successful GitHub Pages deployment confirms the frontend was deployed, not that an authenticated Gemini generation or MP4 render has succeeded end-to-end. Verify a real test request and check the status message before relying on the workflow.
