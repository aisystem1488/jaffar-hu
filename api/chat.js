const OpenAI = require("openai");
const { getSupabase } = require("../lib/supabase");
const { getVertical, buildSystemPrompt, PHASES } = require("../lib/verticals/saas");

const VALID_PHASES = PHASES.map(function (p) {
  return p.id;
});

function setCors(res) {
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "GET, POST, OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type");
}

function parseAssistantPayload(raw) {
  if (!raw) {
    return { reply: "Sajnos nem sikerült válaszolni. Próbáld újra.", phase: "discovery" };
  }

  try {
    var parsed = JSON.parse(raw);
    var phase = VALID_PHASES.includes(parsed.phase) ? parsed.phase : "discovery";
    return {
      reply: parsed.reply || raw,
      phase: phase
    };
  } catch (error) {
    return { reply: raw, phase: "discovery" };
  }
}

function generateSessionId() {
  return "sess_" + Date.now() + "_" + Math.random().toString(36).slice(2, 10);
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

  var openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

  var chatMessages = [
    { role: "system", content: buildSystemPrompt(vertical) },
    { role: "system", content: "Jelenlegi fázis: " + currentPhase + "." }
  ];

  history.forEach(function (msg) {
    chatMessages.push({ role: msg.role, content: msg.content });
  });

  chatMessages.push({ role: "user", content: message });

  var completion;
  try {
    completion = await openai.chat.completions.create({
      model: process.env.OPENAI_MODEL || "gpt-4o-mini",
      messages: chatMessages,
      temperature: 0.6,
      response_format: { type: "json_object" }
    });
  } catch (aiError) {
    console.error("OpenAI error:", aiError);
    return res.status(502).json({ error: "AI szolgáltatás hiba" });
  }

  var assistantRaw = completion.choices[0]?.message?.content || "";
  var assistant = parseAssistantPayload(assistantRaw);

  if (supabase && conversationId) {
    try {
      await supabase.from("messages").insert({
        conversation_id: conversationId,
        role: "assistant",
        content: assistant.reply
      });

      await supabase
        .from("conversations")
        .update({
          phase: assistant.phase,
          updated_at: new Date().toISOString()
        })
        .eq("id", conversationId);
    } catch (dbError) {
      console.error("Supabase save error:", dbError);
    }
  }

  return res.status(200).json({
    reply: assistant.reply,
    phase: assistant.phase,
    sessionId: sessionId,
    conversationId: conversationId,
    vertical: vertical.id
  });
};
