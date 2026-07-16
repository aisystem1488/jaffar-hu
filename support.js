var API_BASE = "https://jaffar-hu.vercel.app";
var SESSION_KEY = "jaffar_support_session";

var EXAMPLES = {
  billing:
    "Szia, kétszer vontátok le a Pro csomag díját ebben a hónapban. Számlaszám: CF-20441. Kérem a visszautalást, Kovács Péter, peter@demo.hu",
  outage:
    "SÜRGŐS: 40 perce nem tölt be a dashboard, az egész sales csapat áll. Holnap ügyfél demó! Éva, North Soft",
  access:
    "Új kollégánkat nem tudom meghívni a workspace-be, a Invite gomb szürkén van. Starter csomagon vagyunk. Anna"
};

var chatLog = document.getElementById("chat-log");
var chatInput = document.getElementById("chat-input");
var chatSend = document.getElementById("chat-send");
var chatHint = document.getElementById("chat-hint");
var chatMeta = document.getElementById("chat-meta");
var chatReset = document.getElementById("chat-reset");
var triageEmpty = document.getElementById("triage-empty");
var triageBody = document.getElementById("triage-body");

function getSessionId() {
  var existing = localStorage.getItem(SESSION_KEY);
  if (existing) return existing;
  var id = "supp_" + Date.now() + "_" + Math.random().toString(36).slice(2, 10);
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

function sentimentLabel(value) {
  var map = {
    neutral: "Neutrális",
    frustrated: "Frusztrált",
    angry: "Dühös",
    positive: "Pozitív"
  };
  return map[value] || value || "—";
}

function urgencyClass(urgency) {
  if (urgency === "critical" || urgency === "high") return "urgency-hot";
  if (urgency === "medium") return "urgency-mid";
  return "urgency-low";
}

function renderTriage(triage) {
  if (!triage) return;

  triageEmpty.hidden = true;
  triageBody.hidden = false;

  document.getElementById("t-subject").textContent = triage.subject || "—";
  document.getElementById("t-category").textContent = triage.categoryLabel || triage.category || "—";

  var urgencyEl = document.getElementById("t-urgency");
  urgencyEl.textContent = triage.urgencyLabel || triage.urgency || "—";
  urgencyEl.className = urgencyClass(triage.urgency);

  document.getElementById("t-sentiment").textContent = sentimentLabel(triage.sentiment);
  document.getElementById("t-draft").textContent = triage.draftReply || "—";
  document.getElementById("t-action").textContent = triage.suggestedAction || "—";

  if (chatMeta) {
    chatMeta.hidden = false;
    chatMeta.textContent =
      (triage.categoryLabel || triage.category || "ticket") +
      " · " +
      (triage.urgencyLabel || triage.urgency || "");
  }
}

function resetSession() {
  localStorage.removeItem(SESSION_KEY);
  chatLog.innerHTML = "";
  addMessage(
    "Szia! CloudFlow support triage vagyok. Írd le a problémát — akár nyers ügyfélüzenetként is beillesztheted.",
    "bot"
  );
  triageEmpty.hidden = false;
  triageBody.hidden = true;
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

  var thinkingMessage = addMessage("Triage folyamatban...", "bot");
  setLoading(true);
  chatHint.hidden = true;

  try {
    var response = await fetch(API_BASE + "/api/triage", {
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

    thinkingMessage.textContent = data.reply || "Kész.";
    renderTriage(data.triage);
  } catch (error) {
    thinkingMessage.textContent = "A triage API jelenleg nem elérhető.";
    chatHint.hidden = false;
    console.error("Triage error:", error);
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
