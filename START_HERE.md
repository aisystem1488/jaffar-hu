# START HERE — Jaffar.hu

**Magán projekt.** Nem kapcsolódik a QX Product Intelligence munkához.  
Workspace: `C:\Projects\jaffar-hu`

## Gyors kontextus

- **Cél:** AI engineering bemutató — élő agent demók + szolgáltatások prezentációja
- **Élő:** https://jaffar-hu.vercel.app/
- **Stack:** Vercel + Supabase + OpenAI
- **n8n:** nem használjuk
- **Domain:** később; egyelőre nem publikus launch

## Élő demók

1. Sales agent — `/` + `/api/chat`
2. Support triage — `/support.html` + `/api/triage`
3. Doc Q&A — `/docs.html` + `/api/ask`
4. Meeting summarizer — `/meeting.html` + `/api/summarize`
5. Admin — `/admin.html` + `/api/leads` (`ADMIN_PASSWORD`)

## Szolgáltatások (csak copy a landingön)

**AI termék-kategorizáló** (`#catalog-classifier`) · **AI SEO** (`#seo`) · **Tudásgráf** (`#knowledge-graph`) · Versenyfigyelő · Árrésfigyelő · Hangagent · Kamera  
(Vezetői dashboard: félretéve. QX app nincs a publikus oldalon — csak általánosított prezentáció.)

## Új chat indításakor

1. Olvasd el: [`docs/HANDOFF_20260716_CHAT_TRANSFER.md`](docs/HANDOFF_20260716_CHAT_TRANSFER.md)
2. Nézd: [`README.md`](README.md)
3. Folytasd abból, ami a handoff „Következő” / döntések részében van

## Indító prompt

```
Folytassuk a Jaffar.hu projektet.
Olvasd el: docs/HANDOFF_20260716_CHAT_TRANSFER.md és README.md
Workspace: C:\Projects\jaffar-hu (magán, NEM QX)
```
