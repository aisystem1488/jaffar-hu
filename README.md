# jaffar-hu

**Jaffar.hu** — AI sales agent demó oldal (magán projekt).

- **Élő frontend:** https://aisystem1488.github.io/jaffar-hu/
- **Stack:** GitHub Pages + Vercel API + Supabase + OpenAI

## Fázis 1 — mit tartalmaz

- Landing: Jaffar.hu AI engineering brand + CloudFlow SaaS demó
- Chat UI fázisjelzővel (6 lépés)
- Vercel API: `POST /api/chat`
- Supabase séma: `supabase/schema.sql`
- SaaS vertical seed: `lib/verticals/saas.js`

## Helyi fejlesztés (API)

```bash
npm install
npx vercel dev
```

Állítsd be a `.env` fájlt (ne commitold):

```
OPENAI_API_KEY=sk-...
SUPABASE_URL=https://xxx.supabase.co
SUPABASE_SERVICE_ROLE_KEY=eyJ...
OPENAI_MODEL=gpt-4o-mini
```

Helyi teszthez a `script.js`-ben: `var API_BASE = "http://localhost:3000";`

## Deploy

### 1. Supabase

1. Új projekt: `jaffar-demo` (Frankfurt)
2. Futtasd: `supabase/schema.sql` a SQL Editorban
3. Másold a URL-t és a **service role** kulcsot (API írásokhoz)

### 2. Vercel

1. Import: `aisystem1488/jaffar-hu`
2. Env vars:
   - `OPENAI_API_KEY`
   - `SUPABASE_URL`
   - `SUPABASE_SERVICE_ROLE_KEY`
   - `OPENAI_MODEL` (opcionális, default: gpt-4o-mini)
3. Deploy után frissítsd a `script.js`-ben az `API_BASE` URL-t

### 3. GitHub Pages

Push a `main` branchre — a statikus oldal automatikusan frissül.

## Dokumentáció

- [`START_HERE.md`](START_HERE.md)
- [`docs/HANDOFF_20260716_CHAT_TRANSFER.md`](docs/HANDOFF_20260716_CHAT_TRANSFER.md)
