const OpenAI = require("openai");
const { getSupabase } = require("../lib/supabase");
const { getVertical, buildSystemPrompt, PHASES } = require("../lib/verticals/saas");
const { TOOL_DEFINITIONS, executeTool } = require("../lib/tools");

const VALID_PHASES = PHASES.map(function (p) {
  return p.id;
});

const MAX_TOOL_ROUNDS = 3;

function setCors(res) {
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "GET, POST, OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type");
}

function generateSessionId() {
  return "sess_" + Date.now() + "_" + Math.random().toString(36).slice(2, 10);
}

function normalizePhase(phase, fallback) {
  return VALID_PHASES.includes(phase) ? phase : fallback || "discovery";
}

async function getOrCreateConversation(supabase, sessionId, vertical) {
  var existing = await supabase
    .from("conversations")
    .select("id, phase")
    .eq("session_id", sessionId)
    .eq("status", "active")
    .order("created_at", { ascending: false })
    .limit(1)
    .maybeSingle();

  if (existing.data) {
    return existing.data;
  }

  var created = await supabase
    .from("conversations")
    .insert({
      session_id: sessionId,
      vertical: vertical,
      status: "active",
      phase: "discovery"
    })
    .select("id, phase")
    .single();

  if (created.error) {
    throw created.error;
  }

  return created.data;
}

async function loadMessages(supabase, conversationId) {
  var result = await supabase
    .from("messages")
    .select("role, content")
    .eq("conversation_id", conversationId)
    .in("role", ["user", "assistant"])
    .order("created_at", { ascending: true })
    .limit(40);

  if (result.error) {
    throw result.error;
  }

  return result.data || [];
}

function detectObjectionPhase(userMessage, currentPhase) {
  var text = (userMessage || "").toLowerCase();
  var objectionHints = ["drága", "költség", "nem most", "gondolkod", "máshol", "olcsóbb", "később"];
  var hit = objectionHints.some(function (w) {
    return text.indexOf(w) !== -1;
  });
  return hit ? "objection" : currentPhase;
}

module.exports = async function handler(req, res) {
  setCors(res);

  if (req.method === "OPTIONS") {
    return res.status(200).end();
  }

  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  if (!process.env.OPENAI_API_KEY) {
    return res.status(500).json({ error: "OPENAI_API_KEY nincs beállítva" });
  }

  var body = req.body || {};
  var message = typeof body.message === "string" ? body.message.trim() : "";
  var sessionId = typeof body.sessionId === "string" ? body.sessionId.trim() : "";
  var verticalId = typeof body.vertical === "string" ? body.vertical : "saas";

  if (!message) {
    return res.status(400).json({ error: "Üres üzenet" });
  }

  if (!sessionId) {
    sessionId = generateSessionId();
  }

  var vertical = getVertical(verticalId);
  var supabase = getSupabase();
  var conversationId = null;
  var currentPhase = "discovery";
  var history = [];
  var latestLead = null;

  if (supabase) {
    try {
      var conversation = await getOrCreateConversation(supabase, sessionId, vertical.id);
      conversationId = conversation.id;
      currentPhase = conversation.phase || "discovery";
      history = await loadMessages(supabase, conversationId);

      await supabase.from("messages").insert({
        conversation_id: conversationId,
        role: "user",
        content: message
      });
    } catch (dbError) {
      console.error("Supabase error:", dbError);
    }
  }

  currentPhase = detectObjectionPhase(message, currentPhase);

  var openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

  var chatMessages = [
    { role: "system", content: buildSystemPrompt(vertical) },
    {
      role: "system",
      content:
        "Jelenlegi fázis: " +
        currentPhase +
        ". Használj toolokat, amikor új adatot kapsz vagy ajánlasz / összefoglalsz."
    }
  ];

  history.forEach(function (msg) {
    chatMessages.push({ role: msg.role, content: msg.content });
  });

  chatMessages.push({ role: "user", content: message });

  var assistantReply = "";
  var finalPhase = currentPhase;

  try {
    for (var round = 0; round < MAX_TOOL_ROUNDS; round++) {
      var completion = await openai.chat.completions.create({
        model: process.env.OPENAI_MODEL || "gpt-4o-mini",
        messages: chatMessages,
        tools: TOOL_DEFINITIONS,
        tool_choice: "auto",
        temperature: 0.6
      });

      var choice = completion.choices[0];
      var assistantMessage = choice && choice.message ? choice.message : null;

      if (!assistantMessage) {
        break;
      }

      chatMessages.push(assistantMessage);

      var toolCalls = assistantMessage.tool_calls || [];

      if (!toolCalls.length) {
        assistantReply = assistantMessage.content || "";
        break;
      }

      for (var i = 0; i < toolCalls.length; i++) {
        var call = toolCalls[i];
        var toolName = call.function && call.function.name;
        var rawArgs = (call.function && call.function.arguments) || "{}";
        var args = {};

        try {
          args = JSON.parse(rawArgs);
        } catch (parseError) {
          args = {};
        }

        var toolResult = {
          ok: false,
          error: "Tool futtatás sikertelen",
          phase: null,
          lead: null
        };

        try {
          toolResult = await executeTool(supabase, conversationId, toolName, args);
          if (toolResult.lead) {
            latestLead = toolResult.lead;
          }
          if (toolResult.phase) {
            finalPhase = normalizePhase(toolResult.phase, finalPhase);
          }
        } catch (toolError) {
          console.error("Tool error:", toolError);
          toolResult = { ok: false, error: String(toolError.message || toolError) };
        }

        chatMessages.push({
          role: "tool",
          tool_call_id: call.id,
          content: JSON.stringify({
            ok: toolResult.ok,
            message: toolResult.message || toolResult.error,
            leadId: toolResult.lead && toolResult.lead.id,
            recommended_product: toolResult.lead && toolResult.lead.recommended_product,
            score: toolResult.lead && toolResult.lead.score
          })
        });
      }

      if (choice.finish_reason === "stop") {
        assistantReply = assistantMessage.content || assistantReply;
        break;
      }
    }

    if (!assistantReply) {
      var followUp = await openai.chat.completions.create({
        model: process.env.OPENAI_MODEL || "gpt-4o-mini",
        messages: chatMessages.concat([
          {
            role: "system",
            content: "Most adj rövid magyar választ a látogatónak tool hívás nélkül."
          }
        ]),
        temperature: 0.6
      });
      assistantReply =
        (followUp.choices[0] &&
          followUp.choices[0].message &&
          followUp.choices[0].message.content) ||
        "Köszönöm! Folytassuk.";
    }
  } catch (aiError) {
    console.error("OpenAI error:", aiError);
    return res.status(502).json({ error: "AI szolgáltatás hiba" });
  }

  finalPhase = normalizePhase(finalPhase, currentPhase);

  if (supabase && conversationId) {
    try {
      await supabase.from("messages").insert({
        conversation_id: conversationId,
        role: "assistant",
        content: assistantReply
      });

      await supabase
        .from("conversations")
        .update({
          phase: finalPhase,
          updated_at: new Date().toISOString()
        })
        .eq("id", conversationId);
    } catch (dbError) {
      console.error("Supabase save error:", dbError);
    }
  }

  return res.status(200).json({
    reply: assistantReply,
    phase: finalPhase,
    sessionId: sessionId,
    conversationId: conversationId,
    vertical: vertical.id,
    leadId: latestLead && latestLead.id,
    score: latestLead && latestLead.score,
    recommendedProduct: latestLead && latestLead.recommended_product
  });
};
