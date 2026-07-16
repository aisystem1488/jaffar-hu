var API_BASE = "https://jaffar-hu.vercel.app";
var SESSION_KEY = "jaffar_docs_session";

var EXAMPLES = {
  sso: "Van SSO a Pro csomagban, vagy csak Enterprise-en?",
  pro: "Mi a különbség a Starter és a Pro között integrációk szempontjából?",
  sla: "Milyen gyorsan reagál a support Pro és Enterprise csomagon?"
};

var chatLog = document.getElementById("chat-log");
var chatInput = document.getElementById("chat-input");
var chatSend = document.getElementById("chat-send");
var chatHint = document.getElementById("chat-hint");
var chatMeta = document.getElementById("chat-meta");
var chatReset = document.getElementById("chat-reset");
var citationsEmpty = document.getElementById("citations-empty");
var citationList = document.getElementById("citation-list");

function getSessionId() {
  var existing = localStorage.getItem(SESSION_KEY);
  if (existing) return existing;
  var id = "docs_" + Date.now() + "_" + Math.random().toString(36).slice(2, 10);
  localStorage.setItem(SESSION_KEY, id);
  return id;
}

function addMessage(text, role) {
  var msg = document.createElement("div");
  msg.className = "chat-message " + role;
  msg.textContent = text;
  chatLog.appendChild(msg);
  chatLog.scrollTop = chatLog.scrollHeight;
  return msg;
}

function setLoading(isLoading) {
  chatSend.disabled = isLoading;
  chatInput.disabled = isLoading;
  chatReset.disabled = isLoading;
}

function escapeHtml(value) {
  return String(value == null ? "" : value)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

function renderCitations(citations) {
  citationList.innerHTML = "";
  if (!citations || !citations.length) {
    citationsEmpty.hidden = false;
    return;
  }

  citationsEmpty.hidden = true;
  citations.forEach(function (cite, index) {
    var article = document.createElement("article");
    article.className = "citation-card";
    article.innerHTML =
      "<header><span>#" +
      (index + 1) +
      "</span><strong>" +
      escapeHtml(cite.title || cite.id) +
      "</strong></header>" +
      "<p>" +
      escapeHtml(cite.excerpt || "") +
      "</p>" +
      (cite.score != null
        ? '<p class="citation-score">similarity: ' + escapeHtml(String(cite.score)) + "</p>"
        : "");
    citationList.appendChild(article);
  });

  if (chatMeta) {
    chatMeta.hidden = false;
    chatMeta.textContent = citations.length + " forrás";
  }
}

function resetSession() {
  localStorage.removeItem(SESSION_KEY);
  chatLog.innerHTML = "";
  addMessage(
    "Szia! A CloudFlow docs agent vagyok. Kérdezz csomagokról, SLA-ról, SSO-ról vagy integrációkról — a válaszhoz forrást is mutatok.",
    "bot"
  );
  citationList.innerHTML = "";
  citationsEmpty.hidden = false;
  if (chatMeta) {
    chatMeta.hidden = true;
    chatMeta.textContent = "";
  }
  chatInput.focus();
}

async function handleSend(presetText) {
  var text = (presetText || chatInput.value).trim();
  if (!text) return;

  addMessage(text, "user");
  chatInput.value = "";

  var thinkingMessage = addMessage("Keresem a tudásbázisban...", "bot");
  setLoading(true);
  chatHint.hidden = true;

  try {
    var response = await fetch(API_BASE + "/api/ask", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        message: text,
        sessionId: getSessionId()
      })
    });

    if (!response.ok) {
      throw new Error("Request failed: " + response.status);
    }

    var data = await response.json();
    if (data.sessionId) {
      localStorage.setItem(SESSION_KEY, data.sessionId);
    }

    thinkingMessage.textContent = data.reply || "Nincs válasz.";
    renderCitations(data.citations || []);
  } catch (error) {
    thinkingMessage.textContent = "A Doc Q&A API jelenleg nem elérhető.";
    chatHint.hidden = false;
    console.error("Docs error:", error);
  } finally {
    setLoading(false);
    chatInput.focus();
  }
}

chatSend.addEventListener("click", function () {
  handleSend();
});

chatInput.addEventListener("keydown", function (event) {
  if (event.key === "Enter") handleSend();
});

chatReset.addEventListener("click", resetSession);

document.querySelectorAll("#example-chips .chip").forEach(function (chip) {
  chip.addEventListener("click", function () {
    var key = chip.getAttribute("data-example");
    var text = EXAMPLES[key];
    if (text) handleSend(text);
  });
});
