const OpenAI = require("openai");
const { getSupabase } = require("../lib/supabase");
const { retrieveDocs } = require("../lib/knowledge/retrieve");

function setCors(res) {
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "GET, POST, OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type");
}

function generateSessionId() {
  return "docs_" + Date.now() + "_" + Math.random().toString(36).slice(2, 10);
}

async function getOrCreateConversation(supabase, sessionId) {
  var existing = await supabase
    .from("conversations")
    .select("id")
    .eq("session_id", sessionId)
    .eq("status", "active")
    .eq("vertical", "docs")
    .order("created_at", { ascending: false })
    .limit(1)
    .maybeSingle();

  if (existing.data) return existing.data;

  var created = await supabase
    .from("conversations")
    .insert({
      session_id: sessionId,
      vertical: "docs",
      status: "active",
      phase: "qa"
    })
    .select("id")
    .single();

  if (created.error) throw created.error;
  return created.data;
}

function buildContext(ranked) {
  return ranked
    .map(function (row, index) {
      return (
        "[" +
        (index + 1) +
        "] id=" +
        row.doc.id +
        " | " +
        row.doc.title +
        "\n" +
        row.doc.content
      );
    })
    .join("\n\n");
}

function parseAskPayload(raw, ranked) {
  var fallbackCitations = ranked.map(function (row) {
    return {
      id: row.doc.id,
      title: row.doc.title,
      excerpt: row.doc.content.slice(0, 160) + (row.doc.content.length > 160 ? "…" : ""),
      score: Math.round(row.score * 1000) / 1000
    };
  });

  if (!raw) {
    return {
      reply: "Nem találtam elegendő információt a tudásbázisban.",
      citations: fallbackCitations
    };
  }

  try {
    var parsed = JSON.parse(raw);
    var citations = Array.isArray(parsed.citations) ? parsed.citations : [];
    var byId = {};
    ranked.forEach(function (row) {
      byId[row.doc.id] = row;
    });

    var normalized = citations
      .map(function (c) {
        var match = byId[c.id];
        if (!match) return null;
        return {
          id: match.doc.id,
          title: match.doc.title,
          excerpt:
            c.excerpt ||
            match.doc.content.slice(0, 160) + (match.doc.content.length > 160 ? "…" : ""),
          score: Math.round(match.score * 1000) / 1000
        };
      })
      .filter(Boolean);

    if (!normalized.length) {
      normalized = fallbackCitations.slice(0, 2);
    }

    return {
      reply: parsed.reply || raw,
      citations: normalized
    };
  } catch (error) {
    return { reply: raw, citations: fallbackCitations.slice(0, 2) };
  }
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
    return res.status(400).json({ error: "Üres kérdés" });
  }

  if (!sessionId) {
    sessionId = generateSessionId();
  }

  var openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });
  var supabase = getSupabase();
  var conversationId = null;

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

  var ranked;
  try {
    ranked = await retrieveDocs(openai, message, 3);
  } catch (embedError) {
    console.error("Embedding error:", embedError);
    return res.status(502).json({ error: "Retrieval hiba" });
  }

  var context = buildContext(ranked);
  var completion;
  try {
    completion = await openai.chat.completions.create({
      model: process.env.OPENAI_MODEL || "gpt-4o-mini",
      temperature: 0.2,
      response_format: { type: "json_object" },
      messages: [
        {
          role: "system",
          content:
            "Te a CloudFlow dokumentációs Q&A agentje vagy. Csak a megadott forrásokból válaszolj magyarul. " +
            "Ha nincs elég info, mondd el őszintén. Ne találj ki funkciókat.\n" +
            "JSON válasz: {\"reply\":\"...\",\"citations\":[{\"id\":\"doc-...\",\"excerpt\":\"rövid idézet\"}]}\n" +
            "A citations.id kötelezően a forrás id-ja legyen."
        },
        {
          role: "user",
          content: "Források:\n" + context + "\n\nKérdés: " + message
        }
      ]
    });
  } catch (aiError) {
    console.error("OpenAI error:", aiError);
    return res.status(502).json({ error: "AI szolgáltatás hiba" });
  }

  var raw = (completion.choices[0] && completion.choices[0].message.content) || "";
  var payload = parseAskPayload(raw, ranked);

  if (supabase && conversationId) {
    try {
      await supabase.from("messages").insert({
        conversation_id: conversationId,
        role: "assistant",
        content: payload.reply
      });
    } catch (dbError) {
      console.error("Supabase save error:", dbError);
    }
  }

  return res.status(200).json({
    reply: payload.reply,
    citations: payload.citations,
    sessionId: sessionId,
    conversationId: conversationId
  });
};
