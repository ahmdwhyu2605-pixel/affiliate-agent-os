# Affiliate Agent OS — AI Agent Setup

## What this adds
The Supabase Edge Function at `supabase/functions/agent-run/index.ts` connects the dashboard backend to Gemini for:
- initial niche research with Google Search grounding,
- research prompts for Shopee product candidates,
- affiliate content concepts and 7-day experiments,
- short-video scripts/storyboards/captions.

It does **not** claim product sales/commission data without evidence, create an affiliate link on your account, render a finished video, or publish to Shopee/TikTok automatically.

## Secure configuration
1. Create or use a Supabase project.
2. Deploy the function named `agent-run` using the Supabase CLI or dashboard-supported Edge Functions deployment flow.
3. Set the server-side secret `GEMINI_API_KEY` in Supabase Edge Function secrets. Do not commit it to GitHub, put it in HTML/JavaScript, or send it in chat.
4. Test with a POST JSON body such as:
   `{"mode":"research","niche":"peralatan rumah","audience":"anak kos","platform":"TikTok"}`
   Or:
   `{"mode":"video","niche":"peralatan rumah","product":"rak lipat","audience":"anak kos","platform":"TikTok"}`
5. Review the returned source URLs and verify products, prices, and affiliate eligibility manually.

## Before full unattended automation
- **Product/affiliate data:** an authorized Shopee Affiliate API/feed or other permitted source is needed. A search result is not an affiliate link.
- **Video rendering:** connect a video-generation/rendering provider and configure its API secret server-side. This function currently returns a storyboard and script only.
- **Publishing:** use an officially supported publishing integration and verify account permissions and platform rules. Do not automate login scraping or bypass platform protections.
- **Persistence and scheduling:** configure Supabase tables, row-level security, scheduled jobs, job status, retry limits, and logs.
- **Human approval:** keep approval before publishing until content accuracy, product claims, and account authorization have been tested.

## Important
GitHub Pages is a static frontend and cannot safely hold private API keys or run a persistent worker. Secrets and scheduled jobs must run server-side. The Edge Function must be deployed to Supabase separately; adding this file to GitHub does not deploy it automatically.
