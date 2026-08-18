# jaffar-hu

**Jaffar.hu** — AI engineering demó- és portfólió oldal (magán projekt, nem QX).

- **Élő (Vercel):** https://jaffar-hu.vercel.app/
- **GitHub Pages:** https://aisystem1488.github.io/jaffar-hu/ (statikus; API a Vercelre megy)
- **Admin:** https://jaffar-hu.vercel.app/admin.html
- **Stack:** Vercel API + Supabase + OpenAI (+ GitHub Pages opcionális frontend)

> Domain (`jaffar.hu`): **még nincs bekötve** — belső teszt, nem publikus launch.

## Élő demók (kipróbálható)

| # | Demó | URL | API |
|---|---|---|---|
| 01 | Sales agent | `/` (#sales-demo) | `POST /api/chat` |
| 02 | Support triage | `/support.html` | `POST /api/triage` |
| 03 | Doc Q&A (RAG) | `/docs.html` | `POST /api/ask` |
| 04 | Meeting summarizer | `/meeting.html` | `POST /api/summarize` |
| — | Lead admin | `/admin.html` | `GET /api/leads` |

## Szolgáltatások (prezentáció, nem élő demó)

A landing `#services` szekciója — üzleti irányok (prezentáció):

1. **AI termék-kategorizáló** (`#catalog-classifier`) — kiemelt, megvalósított  
2. **AI SEO** (`#seo`) — értékesítő copy; önálló  
3. **Tudásgráf** (`#knowledge-graph`) — terméktudás, ami a cégben marad  
4. Versenyfigyelő · 5. Árrésfigyelő · 6. Hangagent · 7. Kamera

Vezetői dashboard ötlet: **félretéve**.

## Env vars (Vercel)

```
OPENAI_API_KEY=sk-...
SUPABASE_URL=https://xxx.supabase.co
SUPABASE_SERVICE_ROLE_KEY=eyJ...
OPENAI_MODEL=gpt-4o-mini
ADMIN_PASSWORD=...
```

## Supabase

1. `supabase/schema.sql` — conversations, messages, leads  
2. `supabase/tickets.sql` — support triage mentés  
3. `supabase/meetings.sql` — meeting összefoglalók  

Részletek: [`supabase/SETUP.md`](supabase/SETUP.md)

## Helyi fejlesztés

```bash
npm install
npx vercel dev
```

Frontend `API_BASE` a `script.js` / `support.js` / `docs.js` / `meeting.js` / `admin.js` fájlokban.

## Dokumentáció

- [`START_HERE.md`](START_HERE.md) — új chat indítás
- [`docs/HANDOFF_20260716_CHAT_TRANSFER.md`](docs/HANDOFF_20260716_CHAT_TRANSFER.md) — döntések + állapot
