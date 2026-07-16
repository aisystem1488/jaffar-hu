# jaffar-hu

**Jaffar.hu** — AI sales agent demó oldal (magán projekt).

- **Vercel (élő + API):** https://jaffar-hu.vercel.app/
- **GitHub Pages:** https://aisystem1488.github.io/jaffar-hu/
- **Admin:** https://jaffar-hu.vercel.app/admin.html
- **Stack:** GitHub Pages + Vercel API + Supabase + OpenAI

## Fázis 1–2 — mit tartalmaz

- Landing: Jaffar.hu brand + CloudFlow SaaS demó + fázisjelző
- Chat API: `POST /api/chat` (OpenAI tool calling)
- Tools: `qualify_lead`, `recommend_product`, `capture_contact`, `summarize_lead`
- Leads API: `GET /api/leads` (jelszó: `x-admin-password`)
- Admin UI: lead lista, score, összefoglaló
- Supabase: `conversations`, `messages`, `leads`

## Env vars (Vercel)

```
OPENAI_API_KEY=sk-...
SUPABASE_URL=https://xxx.supabase.co
SUPABASE_SERVICE_ROLE_KEY=eyJ...
OPENAI_MODEL=gpt-4o-mini
ADMIN_PASSWORD=...
```

## Helyi fejlesztés

```bash
npm install
npx vercel dev
```

## Dokumentáció

- [`START_HERE.md`](START_HERE.md)
- [`docs/HANDOFF_20260716_CHAT_TRANSFER.md`](docs/HANDOFF_20260716_CHAT_TRANSFER.md)
