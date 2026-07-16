const { getSupabase } = require("../lib/supabase");

function setCors(res) {
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "GET, OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type, x-admin-password");
}

function checkAdminPassword(req) {
  var expected = process.env.ADMIN_PASSWORD;
  if (!expected) {
    return { ok: false, status: 500, error: "ADMIN_PASSWORD nincs beállítva" };
  }

  var provided =
    (req.headers && (req.headers["x-admin-password"] || req.headers["X-Admin-Password"])) || "";

  if (provided !== expected) {
    return { ok: false, status: 401, error: "Hibás jelszó" };
  }

  return { ok: true };
}

module.exports = async function handler(req, res) {
  setCors(res);

  if (req.method === "OPTIONS") {
    return res.status(200).end();
  }

  if (req.method !== "GET") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  var auth = checkAdminPassword(req);
  if (!auth.ok) {
    return res.status(auth.status).json({ error: auth.error });
  }

  var supabase = getSupabase();
  if (!supabase) {
    return res.status(500).json({ error: "Supabase nincs konfigurálva" });
  }

  var result = await supabase
    .from("leads")
    .select(
      "id, name, email, company, qualification, recommended_product, score, summary, next_step, created_at, conversation_id, conversations(session_id, phase, vertical, status)"
    )
    .order("created_at", { ascending: false })
    .limit(100);

  if (result.error) {
    console.error("Leads query error:", result.error);
    return res.status(500).json({ error: "Lead lekérdezés sikertelen" });
  }

  var leads = (result.data || []).map(function (row) {
    var conv = row.conversations || {};
    return {
      id: row.id,
      name: row.name,
      email: row.email,
      company: row.company,
      qualification: row.qualification || {},
      recommended_product: row.recommended_product,
      score: row.score,
      summary: row.summary,
      next_step: row.next_step,
      created_at: row.created_at,
      conversation_id: row.conversation_id,
      session_id: conv.session_id || null,
      phase: conv.phase || null,
      vertical: conv.vertical || null
    };
  });

  return res.status(200).json({ leads: leads });
};
