var TOOL_DEFINITIONS = [
  {
    type: "function",
    function: {
      name: "qualify_lead",
      description:
        "Mentsd el / frissítsd a lead minősítési adatait (csapatméret, budget, sürgősség, eszközök, fájdalompont) és a score-t.",
      parameters: {
        type: "object",
        properties: {
          team_size: { type: "string", description: "Csapat mérete, pl. 8 fő" },
          budget: { type: "string", description: "Havi budget keret" },
          urgency: { type: "string", description: "Mikor kellene indulnia" },
          current_tools: { type: "string", description: "Jelenlegi eszközök" },
          pain_point: { type: "string", description: "Fő problémák" },
          integrations: { type: "string", description: "Szükséges integrációk" },
          score: {
            type: "integer",
            description: "Lead minőség 0-100",
            minimum: 0,
            maximum: 100
          }
        },
        additionalProperties: false
      }
    }
  },
  {
    type: "function",
    function: {
      name: "recommend_product",
      description: "Ajánlj egy CloudFlow csomagot a leadnek.",
      parameters: {
        type: "object",
        properties: {
          product_id: {
            type: "string",
            enum: ["starter", "pro", "enterprise"],
            description: "Ajánlott csomag azonosító"
          },
          reason: { type: "string", description: "Rövid indoklás" }
        },
        required: ["product_id"],
        additionalProperties: false
      }
    }
  },
  {
    type: "function",
    function: {
      name: "capture_contact",
      description: "Mentsd el a lead elérhetőségét (név, email, cég).",
      parameters: {
        type: "object",
        properties: {
          name: { type: "string" },
          email: { type: "string" },
          company: { type: "string" }
        },
        required: ["email"],
        additionalProperties: false
      }
    }
  },
  {
    type: "function",
    function: {
      name: "summarize_lead",
      description:
        "Készíts értékesítői összefoglalót a leadről: summary, next_step, végső score.",
      parameters: {
        type: "object",
        properties: {
          summary: { type: "string", description: "Értékesítői összefoglaló" },
          next_step: { type: "string", description: "Javasolt következő lépés" },
          score: {
            type: "integer",
            description: "Végső lead score 0-100",
            minimum: 0,
            maximum: 100
          }
        },
        required: ["summary", "next_step"],
        additionalProperties: false
      }
    }
  }
];

function phaseForTool(name) {
  if (name === "qualify_lead") return "qualification";
  if (name === "recommend_product") return "recommendation";
  if (name === "capture_contact") return "contact";
  if (name === "summarize_lead") return "summary";
  return null;
}

async function getOrCreateLead(supabase, conversationId) {
  var existing = await supabase
    .from("leads")
    .select("*")
    .eq("conversation_id", conversationId)
    .order("created_at", { ascending: false })
    .limit(1)
    .maybeSingle();

  if (existing.data) {
    return existing.data;
  }

  var created = await supabase
    .from("leads")
    .insert({ conversation_id: conversationId, qualification: {} })
    .select("*")
    .single();

  if (created.error) {
    throw created.error;
  }

  return created.data;
}

async function updateLead(supabase, leadId, patch) {
  var result = await supabase
    .from("leads")
    .update(patch)
    .eq("id", leadId)
    .select("*")
    .single();

  if (result.error) {
    throw result.error;
  }

  return result.data;
}

async function executeTool(supabase, conversationId, toolName, args) {
  if (!supabase || !conversationId) {
    return {
      ok: false,
      error: "Nincs adatbázis vagy conversation",
      phase: phaseForTool(toolName),
      lead: null
    };
  }

  var lead = await getOrCreateLead(supabase, conversationId);
  var patch = {};
  var phase = phaseForTool(toolName);

  if (toolName === "qualify_lead") {
    var qualification = Object.assign({}, lead.qualification || {});
    ["team_size", "budget", "urgency", "current_tools", "pain_point", "integrations"].forEach(
      function (key) {
        if (args[key] != null && args[key] !== "") {
          qualification[key] = args[key];
        }
      }
    );
    patch.qualification = qualification;
    if (typeof args.score === "number") {
      patch.score = Math.max(0, Math.min(100, args.score));
    }
  } else if (toolName === "recommend_product") {
    patch.recommended_product = args.product_id;
    var q = Object.assign({}, lead.qualification || {});
    if (args.reason) {
      q.recommend_reason = args.reason;
    }
    patch.qualification = q;
  } else if (toolName === "capture_contact") {
    if (args.name) patch.name = args.name;
    if (args.email) patch.email = args.email;
    if (args.company) patch.company = args.company;
  } else if (toolName === "summarize_lead") {
    patch.summary = args.summary;
    patch.next_step = args.next_step;
    if (typeof args.score === "number") {
      patch.score = Math.max(0, Math.min(100, args.score));
    }
  } else {
    return { ok: false, error: "Ismeretlen tool: " + toolName, phase: null, lead: lead };
  }

  var updated = await updateLead(supabase, lead.id, patch);

  return {
    ok: true,
    tool: toolName,
    phase: phase,
    lead: updated,
    message: "Mentve: " + toolName
  };
}

module.exports = {
  TOOL_DEFINITIONS: TOOL_DEFINITIONS,
  executeTool: executeTool,
  phaseForTool: phaseForTool
};
