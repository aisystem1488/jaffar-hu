const OpenAI = require("openai");
const { getSupabase } = require("../lib/supabase");
const {
  TRIAGE_TOOLS,
  buildSupportSystemPrompt,
  labelFor,
  SUPPORT_CATEGORIES,
  URGENCY_LEVELS
} = require("../lib/verticals/support");

const MAX_TOOL_ROUNDS = 3;

function setCors(res) {
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "GET, POST, OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type");
}

function generateSessionId() {
  return "supp_" + Date.now() + "_" + Math.random().toString(36).slice(2, 10);
}

async function getOrCreateConversation(supabase, sessionId) {
  var existing = await supabase
    .from("conversations")
    .select("id, phase")
    .eq("session_id", sessionId)
    .eq("status", "active")
    .eq("vertical", "support")
    .order("created_at", { ascending: false })
    .limit(1)
    .maybeSingle();

  if (existing.data) return existing.data;

  var created = await supabase
    .from("conversations")
    .insert({
      session_id: sessionId,
      vertical: "support",
      status: "active",
      phase: "triage"
    })
    .select("id, phase")
    .single();

  if (created.error) throw created.error;
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

  if (result.error) throw result.error;
  return result.data || [];
}

async function upsertTicket(supabase, conversationId, args) {
  var patch = {
    category: args.category,
    urgency: args.urgency,
    sentiment: args.sentiment,
    subject: args.subject || null,
    customer_name: args.customer_name || null,
    customer_email: args.customer_email || null,
    draft_reply: args.draft_reply || null,
    suggested_action: args.suggested_action || null,
    fields: { tags: args.tags || [] },
    updated_at: new Date().toISOString()
  };

  var existing = await supabase
    .from("tickets")
    .select("id")
    .eq("conversation_id", conversationId)
    .order("created_at", { ascending: false })
    .limit(1)
    .maybeSingle();

  if (existing.data) {
    var updated = await supabase
      .from("tickets")
      .update(patch)
      .eq("id", existing.data.id)
      .select("*")
      .single();
    if (updated.error) throw updated.error;
    return updated.data;
  }

  var created = await supabase
    .from("tickets")
    .insert(Object.assign({ conversation_id: conversationId }, patch))
    .select("*")
    .single();

  if (created.error) throw created.error;
  return created.data;
}

function publicTriage(ticketOrArgs) {
  if (!ticketOrArgs) return null;
  var category = ticketOrArgs.category;
  var urgency = ticketOrArgs.urgency;
  return {
    category: category,
    categoryLabel: labelFor(SUPPORT_CATEGORIES, category),
    urgency: urgency,
    urgencyLabel: labelFor(URGENCY_LEVELS, urgency),
    sentiment: ticketOrArgs.sentiment,
    subject: ticketOrArgs.subject,
    customerName: ticketOrArgs.customer_name || ticketOrArgs.customerName || null,
    customerEmail: ticketOrArgs.customer_email || ticketOrArgs.customerEmail || null,
    draftReply: ticketOrArgs.draft_reply || ticketOrArgs.draftReply || null,
    suggestedAction: ticketOrArgs.suggested_action || ticketOrArgs.suggestedAction || null,
    tags: (ticketOrArgs.fields && ticketOrArgs.fields.tags) || ticketOrArgs.tags || [],
    ticketId: ticketOrArgs.id || null
  };
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

  if (!message) {
    return res.status(400).json({ error: "Üres üzenet" });
  }

  if (!sessionId) {
    sessionId = generateSessionId();
  }

  var supabase = getSupabase();
  var conversationId = null;
  var history = [];
  var latestTriage = null;

  if (supabase) {
    try {
      var conversation = await getOrCreateConversation(supabase, sessionId);
      conversationId = conversation.id;
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
    { role: "system", content: buildSupportSystemPrompt() }
  ];

  history.forEach(function (msg) {
    chatMessages.push({ role: msg.role, content: msg.content });
  });
  chatMessages.push({ role: "user", content: message });

  var assistantReply = "";

  try {
    for (var round = 0; round < MAX_TOOL_ROUNDS; round++) {
      var completion = await openai.chat.completions.create({
        model: process.env.OPENAI_MODEL || "gpt-4o-mini",
        messages: chatMessages,
        tools: TRIAGE_TOOLS,
        tool_choice: round === 0 ? { type: "function", function: { name: "triage_ticket" } } : "auto",
        temperature: 0.4
      });

      var choice = completion.choices[0];
      var assistantMessage = choice && choice.message;
      if (!assistantMessage) break;

      chatMessages.push(assistantMessage);
      var toolCalls = assistantMessage.tool_calls || [];

      if (!toolCalls.length) {
        assistantReply = assistantMessage.content || "";
        break;
      }

      for (var i = 0; i < toolCalls.length; i++) {
        var call = toolCalls[i];
        var toolName = call.function && call.function.name;
        var args = {};
        try {
          args = JSON.parse((call.function && call.function.arguments) || "{}");
        } catch (e) {
          args = {};
        }

        var toolPayload = { ok: true, triage: publicTriage(args) };

        if (toolName === "triage_ticket") {
          latestTriage = publicTriage(args);
          if (supabase && conversationId) {
            try {
              var ticket = await upsertTicket(supabase, conversationId, args);
              latestTriage = publicTriage(ticket);
              toolPayload.ticketId = ticket.id;
            } catch (ticketError) {
              console.error("Ticket save error:", ticketError);
              toolPayload.ok = false;
              toolPayload.error = "Ticket mentés sikertelen (futtasd a tickets.sql-t?)";
            }
          }
        }

        chatMessages.push({
          role: "tool",
          tool_call_id: call.id,
          content: JSON.stringify(toolPayload)
        });
      }
    }

    if (!assistantReply) {
      var followUp = await openai.chat.completions.create({
        model: process.env.OPENAI_MODEL || "gpt-4o-mini",
        messages: chatMessages.concat([
          {
            role: "system",
            content: "Most adj rövid magyar választ az ügyfélnek tool hívás nélkül."
          }
        ]),
        temperature: 0.5
      });
      assistantReply =
        (followUp.choices[0] &&
          followUp.choices[0].message &&
          followUp.choices[0].message.content) ||
        "Köszönöm az üzenetet, megnéztem.";
    }
  } catch (aiError) {
    console.error("OpenAI error:", aiError);
    return res.status(502).json({ error: "AI szolgáltatás hiba" });
  }

  if (supabase && conversationId) {
    try {
      await supabase.from("messages").insert({
        conversation_id: conversationId,
        role: "assistant",
        content: assistantReply
      });
      await supabase
        .from("conversations")
        .update({ phase: "triage", updated_at: new Date().toISOString() })
        .eq("id", conversationId);
    } catch (dbError) {
      console.error("Supabase save error:", dbError);
    }
  }

  return res.status(200).json({
    reply: assistantReply,
    sessionId: sessionId,
    conversationId: conversationId,
    triage: latestTriage
  });
};
