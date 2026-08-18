# CHAT TRANSFER — Jaffar.hu AI Engineering

> **Olvasd el ezt először**, ha új Cursor chatben folytatod.
> Utoljára frissítve: 2026-07-16

---

## Projekt azonosító

| Mező | Érték |
|---|---|
| **Név** | Jaffar.hu — AI engineering demó / portfólió |
| **Típus** | **Magán projekt** (NEM QX) |
| **Helyi mappa** | `C:\Projects\jaffar-hu` |
| **GitHub** | `https://github.com/aisystem1488/jaffar-hu` |
| **Élő** | `https://jaffar-hu.vercel.app/` |
| **GitHub Pages** | `https://aisystem1488.github.io/jaffar-hu/` |
| **Domain** | `jaffar.hu` — **később** (most EZY webshop; nem kötjük be amíg nincs kész launch) |

---

## Mi ez?

AI engineering bemutató:

1. **Élő demók** — kipróbálható agentek (OpenAI + tool / RAG)
2. **Szolgáltatások** — prezentáció a landingen (`#services`), nem élő API

**Nyelv:** magyar.  
**Fiktív brand a demókban:** CloudFlow (B2B SaaS).  
**Landing brand:** Jaffar.hu.

---

## Architektúra

```
jaffar-hu.vercel.app
    ├── Statikus: index, support, docs, meeting, admin
    └── API: /api/chat, /api/triage, /api/ask, /api/summarize, /api/leads
            └── Supabase + OpenAI
```

**n8n: NEM használjuk.**

---

## Élő demók

| Demó | Frontend | API | Megjegyzés |
|---|---|---|---|
| Sales agent | `index.html` #sales-demo | `POST /api/chat` | tools: qualify, recommend, capture, summarize → `leads` |
| Support triage | `support.html` | `POST /api/triage` | ticket kártya; mentés: `tickets` tábla |
| Doc Q&A | `docs.html` | `POST /api/ask` | embedding retrieval + citations |
| Meeting summarizer | `meeting.html` | `POST /api/summarize` | döntések, action itemek, e-mail; `meeting_summaries` |
| Admin | `admin.html` | `GET /api/leads` | header: `x-admin-password` |

---

## Szolgáltatások (prezentáció only)

Landing `#services` — **nincs élő demó / API** ezekre (prezentáció):

1. **AI termék-kategorizáló** (kiemelt — megvalósított irány; QX-t nem nevezzük a publikus copyban)  
   Kategóriafa + címkézés/attribútumok + SEO szövegek + képleírás; később tudásgráf / knowledge graph csatlakozás.  
   Anchor: `#catalog-classifier`  
2. **AI SEO** (`#seo`) — értékesítő copy: miért talál meg a vevő; önálló megrendelés, kategorizáló nem feltétel  
3. Webes kutató és versenyfigyelő  
4. Ár- és árrésfigyelő (Pricing & Margin Monitor, nem auto-pricing)  
5. Hangagentek  
6. Kameraelemzés (szűk use case)

**Vezetői dashboard:** félretéve.  
**QX:** belső projekt; a Jaffar.hu-n csak általánosított case study, nem az ügyfélapp.

---

## Infrastruktúra állapot

| Szolgáltatás | Állapot |
|---|---|
| GitHub `aisystem1488/jaffar-hu` | ✅ |
| Vercel projekt `jaffar-hu` | ✅ deploy + env |
| Supabase `jaffar-demo` (`kigordfjtbjsxlrdvafc`) | ✅ schema; tickets/meetings SQL külön futtatandó |
| OpenAI | ✅ külön projekt kulcs |
| `ADMIN_PASSWORD` | ✅ beállítva |
| `jaffar.hu` DNS | ❌ később |

### Env vars (Vercel)

```
OPENAI_API_KEY=
SUPABASE_URL=https://kigordfjtbjsxlrdvafc.supabase.co
SUPABASE_SERVICE_ROLE_KEY=
OPENAI_MODEL=gpt-4o-mini
ADMIN_PASSWORD=
```

### Supabase SQL fájlok

- `supabase/schema.sql` — conversations, messages, leads  
- `supabase/tickets.sql` — support  
- `supabase/meetings.sql` — meeting summaries  
- `supabase/SETUP.md` — lépések  

---

## Repó struktúra (fő fájlok)

```
jaffar-hu/
├── index.html, styles.css, script.js   # landing + sales demó + services
├── support.html / support.js
├── docs.html / docs.js
├── meeting.html / meeting.js
├── admin.html / admin.js
├── api/chat.js, triage.js, ask.js, summarize.js, leads.js
├── lib/supabase.js, tools.js
├── lib/verticals/saas.js, support.js, meeting.js
├── lib/knowledge/cloudflow.js, retrieve.js
├── supabase/*.sql, SETUP.md
├── README.md, START_HERE.md
└── docs/HANDOFF_20260716_CHAT_TRANSFER.md
```

---

## Amit NEM csinálunk (egyelőre)

- Valódi CRM / e-mail küldés  
- `jaffar.hu` DNS bekötés  
- Élő versenyfigyelő / pricing / hang / kamera demó  
- Vezetői dashboard  
- n8n / Make / Zapier  

---

## Mérföldkövek (állapot)

### Kész
- [x] Fázis 1: landing + `/api/chat` + Supabase séma + n8n kiváltás  
- [x] Fázis 2: sales tools + admin + `ADMIN_PASSWORD`  
- [x] UI polish (brand-first landing), domain deferred  
- [x] Support triage demó  
- [x] Doc Q&A demó  
- [x] Meeting summarizer demó  
- [x] Szolgáltatások prezentációs szekció  

### Nyitott / később
- [ ] `tickets.sql` / `meetings.sql` futtatás ellenőrzése user oldalon (ha még nem)  
- [ ] Domain + publikus launch  
- [ ] Opcionális: élő demó a services irányokból (versenyfigyelő először)  
- [ ] Vezetői dashboard (félretéve)  

---

## QX — NE KEVERD

- **QX:** `C:\QX\qx-product-intelligence-v3`  
- **Jaffar:** `C:\Projects\jaffar-hu`  

---

## Indító prompt

```
Folytassuk a Jaffar.hu projektet.
Olvasd el: docs/HANDOFF_20260716_CHAT_TRANSFER.md és README.md
Workspace: C:\Projects\jaffar-hu (magán, NEM QX)
```

---

## Döntések napló

| Dátum | Döntés |
|---|---|
| 2026-07-14 | AI sales agent demó; n8n helyett Vercel + Supabase |
| 2026-07-16 | Projekt: `C:\Projects\jaffar-hu`; Vercel import; CloudFlow SaaS |
| 2026-07-16 | Fázis 1–2 kész; admin + tool calling |
| 2026-07-16 | Domain deferred; belső teszt URL |
| 2026-07-16 | + Support, Doc Q&A, Meeting élő demók |
| 2026-07-16 | 4 szolgáltatás = prezentáció only (nem élő demó) |
| 2026-07-31 | AI termék-kategorizáló a landingre (prezentáció, QX nélkül) |
| 2026-08-18 | AI SEO optimalizálás külön szolgáltatás (`#seo`) |
| 2026-07-16 | Vezetői dashboard félretéve |
| 2026-07-16 | Dokumentáció frissítve (README, START_HERE, handoff) |
