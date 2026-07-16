var CLOUDFLOW_DOCS = [
  {
    id: "doc-overview",
    title: "CloudFlow áttekintés",
    content:
      "A CloudFlow B2B projekt- és workflow menedzsment platform. Csapatok egy helyen kezelhetik a projekteket, automatizált workflow-kat és riportokat. Célpiac: magyar és EU-s kis- és középvállalatok, valamint növekvő sales/ops csapatok."
  },
  {
    id: "doc-starter",
    title: "Starter csomag",
    content:
      "Starter: 29 000 Ft/hó, legfeljebb 5 felhasználó. Tartalmazza: alap projekt táblák és kanban, e-mail értesítések, 5 automatizált workflow, e-mail support. Ideális kis csapatoknak és egyszerű folyamatokhoz. Nincs API integráció és nincs SSO."
  },
  {
    id: "doc-pro",
    title: "Pro csomag",
    content:
      "Pro: 79 000 Ft/hó, legfeljebb 25 felhasználó. Tartalmazza: minden Starter funkció, haladó riportok és dashboard, API integráció Slack és Google Workspace felé, korlátlan workflow, prioritásos support. Ideális növekvő csapatoknak, több párhuzamos projekttel."
  },
  {
    id: "doc-enterprise",
    title: "Enterprise csomag",
    content:
      "Enterprise: egyedi árazás, korlátlan felhasználó. Tartalmazza: minden Pro funkció, SSO/SAML, dedikált account manager, SLA és audit napló, on-premise vagy privát cloud opció. Ideális nagyvállalatoknak és compliance igényekhez."
  },
  {
    id: "doc-billing",
    title: "Számlázás és fizetés",
    content:
      "A számlázás havonta történik, a számla a fiók admin e-mailjére megy. Fizetés: bankkártya vagy átutalás (Pro és Enterprise). Dupla levonás esetén a support 3 munkanapon belül visszautal. Számlamódosítás: Settings → Billing. Áfa: magyar cégeknek 27%."
  },
  {
    id: "doc-sso",
    title: "SSO és biztonság",
    content:
      "SSO/SAML csak Enterprise csomagon érhető el. Támogatott IdP: Okta, Azure AD, Google Workspace. 2FA minden csomagon bekapcsolható. Audit napló és IP allowlist: Enterprise. Adatok EU (Frankfurt) régióban tárolódnak."
  },
  {
    id: "doc-integrations",
    title: "Integrációk",
    content:
      "Pro és Enterprise: natív Slack és Google Workspace integráció. REST API Pro-tól. Webhook-ok: workflow eseményekre. Zapier/Make: nem hivatalos, de API-n keresztül lehetséges. Starteren nincs API kulcs."
  },
  {
    id: "doc-workflow",
    title: "Workflow automatizáció",
    content:
      "Workflow: trigger → feltétel → akció. Példa: ha feladat késik, Slack üzenet a felelősnek. Starter: max 5 aktív workflow. Pro/Enterprise: korlátlan. Akciók: e-mail, Slack, státuszváltás, mezőfrissítés, webhook."
  },
  {
    id: "doc-support-sla",
    title: "Support SLA",
    content:
      "Starter: e-mail support, válasz 1-2 munkanap. Pro: prioritásos, cél 8 munkaórán belül. Enterprise: dedikált CSM + SLA szerződés, kritikus hibánál 30 perces reakció. Status page: status.cloudflow.demo (fiktív)."
  },
  {
    id: "doc-onboarding",
    title: "Onboarding és migráció",
    content:
      "Új fiók: 14 napos próba Pro funkciókkal, bankkártya nélkül. Import: CSV feladatok és Trello board. Enterprise: dedikált onboarding workshop. Átlagos go-live kis csapatnál 3-5 nap, nagyobb orgnál 2-4 hét."
  },
  {
    id: "doc-limits",
    title: "Korlátok és storage",
    content:
      "Starter: 5 GB fájltár. Pro: 50 GB. Enterprise: egyedi. Melléklet max méret: 25 MB / fájl. Projekt archiválás minden csomagon elérhető. Soft delete: 30 napig visszaállítható."
  },
  {
    id: "doc-api-auth",
    title: "API autentikáció",
    content:
      "API kulcs: Settings → Developers (Pro+). Auth header: Authorization: Bearer cf_live_xxx. Rate limit: 120 kérés / perc / workspace. Sandbox kulcsok: cf_test_ előtag. Webhook aláírás: HMAC SHA-256."
  }
];

module.exports = { CLOUDFLOW_DOCS: CLOUDFLOW_DOCS };
