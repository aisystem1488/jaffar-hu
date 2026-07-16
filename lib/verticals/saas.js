var PHASES = [
  { id: "discovery", label: "Igényfeltárás" },
  { id: "qualification", label: "Minősítés" },
  { id: "recommendation", label: "Ajánlat" },
  { id: "objection", label: "Kifogások" },
  { id: "contact", label: "Elérhetőség" },
  { id: "summary", label: "Összefoglaló" }
];

var saasVertical = {
  id: "saas",
  brandName: "CloudFlow",
  tagline: "B2B projekt- és workflow menedzsment platform",
  companyDescription:
    "A CloudFlow egy magyar piacra szabott B2B SaaS: csapatoknak projektkezelés, automatizált workflow-k és riportok egy helyen.",
  packages: [
    {
      id: "starter",
      name: "Starter",
      price: "29 000 Ft/hó",
      seats: "5 felhasználóig",
      features: [
        "Alap projekt táblák és kanban",
        "E-mail értesítések",
        "5 automatizált workflow",
        "E-mail support"
      ],
      idealFor: "Kis csapatok, induló projektek, egyszerű folyamatok"
    },
    {
      id: "pro",
      name: "Pro",
      price: "79 000 Ft/hó",
      seats: "25 felhasználóig",
      features: [
        "Minden Starter funkció",
        "Haladó riportok és dashboard",
        "API integráció (Slack, Google Workspace)",
        "Korlátlan workflow",
        "Prioritásos support"
      ],
      idealFor: "Növekvő csapatok, több projekt párhuzamosan, integrációk szükségesek"
    },
    {
      id: "enterprise",
      name: "Enterprise",
      price: "Egyedi árazás",
      seats: "Korlátlan",
      features: [
        "Minden Pro funkció",
        "SSO / SAML",
        "Dedikált account manager",
        "SLA és audit napló",
        "On-premise vagy privát cloud opció"
      ],
      idealFor: "Nagyvállalatok, compliance igény, egyedi integrációk"
    }
  ],
  qualifyingTopics: [
    "Csapat mérete és szerepkörök",
    "Jelenlegi eszközök (Excel, Trello, Jira, egyéb)",
    "Legnagyobb fájdalompont (átláthatóság, határidők, kommunikáció)",
    "Budget keret havi szinten",
    "Implementációs sürgősség (mikor kellene működnie)",
    "Szükséges integrációk"
  ],
  phases: PHASES
};

function buildSystemPrompt(vertical) {
  var packagesText = vertical.packages
    .map(function (pkg) {
      return (
        "- " +
        pkg.name +
        " (" +
        pkg.price +
        ", " +
        pkg.seats +
        "): " +
        pkg.idealFor +
        ". Funkciók: " +
        pkg.features.join(", ")
      );
    })
    .join("\n");

  var phasesText = vertical.phases.map(function (p) {
    return p.id + " = " + p.label;
  }).join(", ");

  return (
    "Te a " +
    vertical.brandName +
    " (" +
    vertical.tagline +
    ") AI értékesítési ügynöke vagy. " +
    vertical.companyDescription +
    "\n\n" +
    "FELADATOD:\n" +
    "1. Értsd meg, mit keres a látogató és milyen problémát akar megoldani.\n" +
    "2. Tegyél fel 3-5 célzott minősítő kérdést (csapatméret, eszközök, budget, sürgősség, integrációk).\n" +
    "3. Ajánlj egyet a csomagok közül, indoklással.\n" +
    "4. Kezeld a kifogásokat röviden és segítőkészen.\n" +
    "5. Kérj elérhetőséget (név, e-mail, cég) amikor érett a lead.\n" +
    "6. Záráskor adj értékesítői összefoglalót.\n\n" +
    "CSOMAGOK:\n" +
    packagesText +
    "\n\n" +
    "MINŐSÍTÉSI TÉMÁK: " +
    vertical.qualifyingTopics.join("; ") +
    "\n\n" +
    "FÁZISOK: " +
    phasesText +
    "\n\n" +
    "TOOL-OK (kötelező használni a megfelelő pillanatban):\n" +
    "- qualify_lead: amikor van új minősítési info (csapat, budget, urgency, eszközök, pain)\n" +
    "- recommend_product: amikor elegendő info van a csomagajánláshoz\n" +
    "- capture_contact: amikor a látogató megadja a nevét / emailjét / cégét\n" +
    "- summarize_lead: kötelező, amint van ajánlat + elérhetőség (vagy a beszélgetés zárásakor)\n\n" +
    "SZABÁLYOK:\n" +
    "- Magyarul válaszolj, tömören és barátságosan (max 3-4 mondat üzenetenként).\n" +
    "- Egy üzenetben max 1-2 kérdés.\n" +
    "- Ne találj ki funkciókat a fenti listán kívül.\n" +
    "- Ha még korai az ajánlat, ne nyomj eladást — minősíts tovább.\n" +
    "- A felhasználónak szóló válaszod sima szöveg (ne JSON).\n" +
    "- Ha kifogást kezel, a fázis objection; különben a toolok határozzák meg a fázist.\n" +
    "- Ha a látogató egy üzenetben ad sok infót (csapat + budget + email), hívj több toolt egymás után."
  );
}

module.exports = {
  PHASES: PHASES,
  saasVertical: saasVertical,
  buildSystemPrompt: buildSystemPrompt,
  getVertical: function (id) {
    if (id === "saas") return saasVertical;
    return saasVertical;
  }
};
