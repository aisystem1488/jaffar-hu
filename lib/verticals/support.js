var SUPPORT_CATEGORIES = [
  { id: "billing", label: "Számlázás" },
  { id: "technical", label: "Technikai hiba" },
  { id: "account", label: "Fiók / hozzáférés" },
  { id: "feature", label: "Funkció / how-to" },
  { id: "cancellation", label: "Lemondás / churn" },
  { id: "other", label: "Egyéb" }
];

var URGENCY_LEVELS = [
  { id: "low", label: "Alacsony", sla: "48 óra" },
  { id: "medium", label: "Közepes", sla: "8 óra" },
  { id: "high", label: "Magas", sla: "2 óra" },
  { id: "critical", label: "Kritikus", sla: "30 perc" }
];

function buildSupportSystemPrompt() {
  var categories = SUPPORT_CATEGORIES.map(function (c) {
    return c.id + " (" + c.label + ")";
  }).join(", ");

  var urgencies = URGENCY_LEVELS.map(function (u) {
    return u.id + " (" + u.label + ", SLA " + u.sla + ")";
  }).join(", ");

  return (
    "Te egy B2B SaaS ügyfélszolgálati triage agent vagy (CloudFlow support).\n" +
    "Feladatod: az ügyfél üzenetét osztályozni, prioritizálni, és válaszvázlatot adni.\n\n" +
    "KATEGÓRIÁK: " +
    categories +
    "\n" +
    "URGENCY: " +
    urgencies +
    "\n\n" +
    "Minden felhasználói üzenet után hívd a triage_ticket toolt friss adatokkal.\n" +
    "Ha hiányzik info, a válaszban kérdezz max 1-2 rövid kérdést.\n" +
    "Magyarul, tömören, empatikusan válaszolj (max 3-4 mondat).\n" +
    "Ne találj ki számlákat, hibakódokat vagy SLA-t a fentieken kívül.\n" +
    "A felhasználónak szóló válaszod sima szöveg (ne JSON)."
  );
}

var TRIAGE_TOOLS = [
  {
    type: "function",
    function: {
      name: "triage_ticket",
      description:
        "Mentse / frissítse a support ticket triage eredményét: kategória, urgency, hangnem, válaszvázlat, következő lépés.",
      parameters: {
        type: "object",
        properties: {
          category: {
            type: "string",
            enum: ["billing", "technical", "account", "feature", "cancellation", "other"]
          },
          urgency: {
            type: "string",
            enum: ["low", "medium", "high", "critical"]
          },
          sentiment: {
            type: "string",
            enum: ["neutral", "frustrated", "angry", "positive"]
          },
          subject: { type: "string", description: "Rövid ticket tárgy" },
          customer_name: { type: "string" },
          customer_email: { type: "string" },
          draft_reply: {
            type: "string",
            description: "Ügyfélnek szánt válaszvázlat (magyar)"
          },
          suggested_action: {
            type: "string",
            description: "Belső következő lépés az agent / support számára"
          },
          tags: {
            type: "array",
            items: { type: "string" },
            description: "Rövid címkék"
          }
        },
        required: ["category", "urgency", "sentiment", "subject", "draft_reply", "suggested_action"],
        additionalProperties: false
      }
    }
  }
];

function labelFor(list, id) {
  var found = list.find(function (item) {
    return item.id === id;
  });
  return found ? found.label : id;
}

module.exports = {
  SUPPORT_CATEGORIES: SUPPORT_CATEGORIES,
  URGENCY_LEVELS: URGENCY_LEVELS,
  TRIAGE_TOOLS: TRIAGE_TOOLS,
  buildSupportSystemPrompt: buildSupportSystemPrompt,
  labelFor: labelFor
};
