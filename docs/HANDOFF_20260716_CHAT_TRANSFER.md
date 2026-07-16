# CHAT TRANSFER — 2026-07-16 — Jaffar.hu AI Sales Agent Demo

> **Olvasd el ezt először**, ha új Cursor chatben folytatod a munkát.
> Ez a fájl a korábbi beszélgetés döntéseit és állapotát rögzíti.

---

## Projekt azonosító

| Mező | Érték |
|---|---|
| **Név** | Jaffar.hu — AI engineering demó oldal |
| **Típus** | **Magán projekt** (NEM kapcsolódik a QX munkához) |
| **Helyi mappa** | `C:\Projects\jaffar-hu` |
| **GitHub** | `https://github.com/aisystem1488/jaffar-hu` |
| **Élő statikus oldal** | `https://aisystem1488.github.io/jaffar-hu/` |
| **Domain** | `jaffar.hu` — jelenleg **más oldal** fut rajta (EZY kávés webshop); domain bekötés **később** |

---

## Mit építünk?

**Általánosítható AI sales agent demó** — nem egyszerű chatbot.

Agent folyamat (cél):
1. Megérti, mit keres a látogató
2. 3–5 releváns kérdés (minősítés)
3. Lead minősítés (budget, sürgősség, fit)
4. Termék/csomag ajánlás
5. Kifogáskezelés
6. Elérhetőség kérése
7. Értékesítői összefoglaló
8. (Opcionális) ajánlatkérés / időpont szimuláció

**Landing arculat:** `Jaffar.hu` = AI engineering vállalkozás (te).
**Első demó vertical:** fiktív **B2B SaaS** cég (Starter / Pro / Enterprise csomagok).
A „vertical” ≠ landing design — a demóban az agent egy szoftvercég ügynökeként viselkedik.

**Nyelv:** magyar (első körben).

---

## Architektúra (elfogadott)

```
jaffar.hu (domain, később)
    │
    ├── GitHub Pages ──→ index.html, styles.css, script.js  (landing + chat UI)
    │
    └── Vercel API ──→ /api/chat, /api/leads, /admin
                            │
                            └── Supabase (conversations, messages, leads)
```

**n8n: KIKAPCSOLVA / NEM HASZNÁLJUK.** Előfizetés lemondva.
A `script.js` még n8n webhookot hív — ezt le kell cserélni Vercel API-ra.

**Miért hibrid?** GitHub Pages = ingyenes statikus deploy (push → élő).
Vercel = serverless API (OpenAI, Supabase) — GitHub Pages ezt nem tudja.

---

## Infrastruktúra állapot (2026-07-16)

| Szolgáltatás | Állapot | Megjegyzés |
|---|---|---|
| **GitHub repo** | ✅ Kész | `aisystem1488/jaffar-hu`, GitHub Pages aktív |
| **OpenAI API** | ✅ Van kulcs | Usernek megvan; env var-ként Vercelre |
| **Supabase** | ⏳ Fiók van, projekt létrehozása folyamatban | Új projekt neve javasolt: `jaffar-demo`, region: Frankfurt |
| **Vercel** | ⏳ Fiók létrehozva | User: István Priskin, GitHub összekötve. **Projekt még NINCS importálva** — várjuk a kódot |
| **n8n cloud** | ❌ Lemondva | Ne használd |
| **jaffar.hu domain** | ⏳ Később | Most ne kösd be; előbb működő deploy kell |

### Vercel — mit csinált a user
- Regisztrált: vercel.com, GitHub login
- Van egy régi projekt: `aw-report-demo` — **ne ezt használd**
- **Még nem importálta** a `jaffar-hu` repót (szándékosan — előbb API kód kell)

### Supabase — következő user lépés
1. supabase.com/dashboard → New Project
2. Név: `jaffar-demo`
3. Region: Frankfurt (eu-central-1)
4. Jelszó: generáld, mentsd el
5. Kulcsok → Vercel env vars (NE commitold a repóba)

---

## Amit az első verzióba NEM teszünk

- Valódi CRM integráció
- Valódi email küldés (később Resend free tier)
- Telefonos / hang agent
- Több agent együttműködés
- Ügyfélfiókok
- n8n / Make / Zapier

---

## Mérföldkövek

### Fázis 1 — Landing + működő chat (első)
- [x] Landing copy: Jaffar.hu AI engineering brand
- [x] Demó szekció + chat UI fejlesztés (fázisjelző)
- [x] Vercel API: `/api/chat` (OpenAI)
- [x] Supabase séma: conversations, messages, leads
- [x] `script.js`: n8n webhook → Vercel API URL
- [x] SaaS vertical seed adat (3 csomag, minősítő kérdések)
- [ ] **User:** Supabase projekt + séma futtatás + Vercel import + env vars + deploy

### Fázis 2 — Sales agent + admin
- [ ] Agent tool calling: qualify, recommend, capture, summarize
- [ ] `/admin`: lead lista, score, összefoglaló
- [ ] Egyszerű jelszóvédelem adminra

### Fázis 3 — Domain + polish
- [ ] Vercel deploy + env vars
- [ ] `jaffar.hu` DNS → Vercel (vagy GitHub Pages frontend + api subdomain)
- [ ] UI polish, mobil
- [ ] 3 vertical választó (marketing, SaaS, napelem) — opcionális később

---

## Jelenlegi repó tartalom

```
jaffar-hu/
├── index.html              # Jaffar.hu brand landing + CloudFlow demó + fázisjelző
├── script.js               # Chat → Vercel API (/api/chat), session localStorage
├── styles.css              # Sötétkék + narancs/kék accent, fázis UI
├── package.json            # Vercel API függőségek
├── vercel.json             # CORS + function config
├── api/chat.js             # OpenAI + Supabase chat endpoint
├── lib/
│   ├── supabase.js
│   └── verticals/saas.js   # CloudFlow seed (3 csomag)
├── supabase/schema.sql     # conversations, messages, leads
├── README.md
├── START_HERE.md
└── docs/
    └── HANDOFF_20260716_CHAT_TRANSFER.md
```

### script.js — backend (Vercel API)
```
POST {API_BASE}/api/chat
Body: { message, sessionId, vertical: "saas" }
Response: { reply, phase, sessionId, conversationId, vertical }
```

---

## Supabase séma vázlat (Fázis 1-hez)

```sql
-- verticals (később, Fázis 2+)
-- products (később)

create table conversations (
  id uuid primary key default gen_random_uuid(),
  session_id text not null,
  vertical text default 'saas',
  status text default 'active',
  created_at timestamptz default now()
);

create table messages (
  id uuid primary key default gen_random_uuid(),
  conversation_id uuid references conversations(id),
  role text not null, -- 'user' | 'assistant'
  content text not null,
  created_at timestamptz default now()
);

create table leads (
  id uuid primary key default gen_random_uuid(),
  conversation_id uuid references conversations(id),
  name text,
  email text,
  company text,
  qualification jsonb,  -- budget, urgency, team_size, etc.
  recommended_product text,
  score int,
  summary text,
  next_step text,
  created_at timestamptz default now()
);
```

---

## Vercel env vars (deploykor)

```
OPENAI_API_KEY=sk-...
SUPABASE_URL=https://xxx.supabase.co
SUPABASE_SERVICE_ROLE_KEY=eyJ...   # API írásokhoz (service role, NE anon)
SUPABASE_ANON_KEY=eyJ...            # fallback, ha nincs service role
OPENAI_MODEL=gpt-4o-mini            # opcionális
ADMIN_PASSWORD=...                  # Fázis 2 — admin védelem
```

---

## QX projekt — NE KEVERD

- **QX munka:** `C:\QX\qx-product-intelligence-v3`
- **Jaffar magán:** `C:\Projects\jaffar-hu`
- Korábbi chat véletlenül QX workspace-ben futott — ez hiba volt, javítva.

---

## Következő chat indító prompt (másold be)

```
Folytassuk a Jaffar.hu AI sales agent demót.

Olvasd el: docs/HANDOFF_20260716_CHAT_TRANSFER.md

Állapot:
- Repo: C:\Projects\jaffar-hu (magán projekt, NEM QX)
- Vercel fiók kész, GitHub összekötve, projekt még nincs importálva
- Supabase fiók van, projekt létrehozása folyamatban
- n8n lemondva, script.js-ben még benne van a régi webhook

Kezdjük a Fázis 1-et: landing frissítés + Vercel API scaffold + Supabase séma + n8n kiváltása.
Nyelv: magyar. Első vertical: B2B SaaS.
```

---

## Döntések napló

| Dátum | Döntés |
|---|---|
| 2026-07-14 | AI sales agent demó koncepció elfogadva |
| 2026-07-14 | n8n helyett tiszta kód (Vercel + Supabase) |
| 2026-07-14 | jaffar-hu repó használata, GitHub Pages marad frontendnek |
| 2026-07-16 | Projekt áthelyezve: C:\Projects\jaffar-hu (QX-től elkülönítve) |
| 2026-07-16 | Vercel fiók létrehozva, import később |
| 2026-07-16 | Első vertical: B2B SaaS, nyelv: magyar |
