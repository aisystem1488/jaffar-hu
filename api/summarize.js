const OpenAI = require("openai");
const { getSupabase } = require("../lib/supabase");
const {
  buildMeetingSystemPrompt,
  MEETING_TOOLS,
  publicMeeting
} = require("../lib/verticals/meeting");

const MAX_TOOL_ROUNDS = 3;

function setCors(res) {
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "GET, POST, OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type");
}

function generateSessionId() {
  return "meet_" + Date.now() + "_" + Math.random().toString(36).slice(2, 10);
}

async function getOrCreateConversation(supabase, sessionId) {
  var existing = await supabase
    .from("conversations")
    .select("id")
    .eq("session_id", sessionId)
    .eq("status", "active")
    .eq("vertical", "meeting")
    .order("created_at", { ascending: false })
    .limit(1)
    .maybeSingle();

  if (existing.data) return existing.data;

  var created = await supabase
    .from("conversations")
    .insert({
      session_id: sessionId,
      vertical: "meeting",
      status: "active",
      phase: "summary"
    })
    .select("id")
    .single();

  if (created.error) throw created.error;
  return created.data;
}

async function saveMeeting(supabase, conversationId, args) {
  var row = {
    conversation_id: conversationId,
    title: args.title || null,
    summary: args.summary || null,
    decisions: args.decisions || [],
    action_items: args.action_items || [],
    open_questions: args.open_questions || [],
    follow_up_email: args.follow_up_email || null,
    participants: args.participants || []
  };

  var created = await supabase.from("meeting_summaries").insert(row).select("*").single();
  if (created.error) throw created.error;
  return created.data;
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
    return res.status(400).json({ error: "Üres jegyzet" });
  }

  if (!sessionId) {
    sessionId = generateSessionId();
  }

  var supabase = getSupabase();
  var conversationId = null;
  var latestMeeting = null;

  if (supabase) {
    try {
      var conversation = await getOrCreateConversation(supabase, sessionId);
      conversationId = conversation.id;
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
    { role: "system", content: buildMeetingSystemPrompt() },
    { role: "user", content: message }
  ];

  var assistantReply = "";

  try {
    for (var round = 0; round < MAX_TOOL_ROUNDS; round++) {
      var completion = await openai.chat.completions.create({
        model: process.env.OPENAI_MODEL || "gpt-4o-mini",
        messages: chatMessages,
        tools: MEETING_TOOLS,
        tool_choice:
          round === 0
            ? { type: "function", function: { name: "summarize_meeting" } }
            : "auto",
        temperature: 0.3
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
        var args = {};
        try {
          args = JSON.parse((call.function && call.function.arguments) || "{}");
        } catch (e) {
          args = {};
        }

        latestMeeting = publicMeeting(args);
        var toolPayload = { ok: true, meeting: latestMeeting };

        if (supabase && conversationId) {
          try {
            var saved = await saveMeeting(supabase, conversationId, args);
            latestMeeting = publicMeeting(Object.assign({}, args, { id: saved.id }));
            toolPayload.meetingId = saved.id;
          } catch (saveError) {
            console.error("Meeting save error:", saveError);
            toolPayload.ok = false;
            toolPayload.error = "Mentés sikertelen (futtasd a meetings.sql-t?)";
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
            content:
              "Adj rövid magyar megerősítést (1-2 mondat): kész az összefoglaló, nézze a panelt."
          }
        ]),
        temperature: 0.4
      });
      assistantReply =
        (followUp.choices[0] &&
          followUp.choices[0].message &&
          followUp.choices[0].message.content) ||
        "Kész az összefoglaló — a részletek a jobb oldali panelen.";
    }
  } catch (aiError) {
    console.error("OpenAI error:", aiError);
    return res.status(502).json({ error: "AI szolgáltatás hiba" });
  }

  if (supabase && conversationId && assistantReply) {
    try {
      await supabase.from("messages").insert({
        conversation_id: conversationId,
        role: "assistant",
        content: assistantReply
      });
    } catch (dbError) {
      console.error("Supabase save error:", dbError);
    }
  }

  return res.status(200).json({
    reply: assistantReply,
    meeting: latestMeeting,
    sessionId: sessionId,
    conversationId: conversationId
  });
};
