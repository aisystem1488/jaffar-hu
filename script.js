// Vercel API URL — frissítsd az első deploy után (pl. https://jaffar-hu.vercel.app)
var API_BASE = "https://jaffar-hu.vercel.app";

var SESSION_KEY = "jaffar_session_id";

var PHASE_ORDER = [
  "discovery",
  "qualification",
  "recommendation",
  "objection",
  "contact",
  "summary"
];

var chatLog = document.getElementById("chat-log");
var chatInput = document.getElementById("chat-input");
var chatSend = document.getElementById("chat-send");
var chatHint = document.getElementById("chat-hint");
var chatMeta = document.getElementById("chat-meta");
var chatReset = document.getElementById("chat-reset");
var phaseTrack = document.getElementById("phase-track");

function getSessionId() {
  var existing = localStorage.getItem(SESSION_KEY);
  if (existing) return existing;
  var id = "sess_" + Date.now() + "_" + Math.random().toString(36).slice(2, 10);
  localStorage.setItem(SESSION_KEY, id);
  return id;
}

function resetSession() {
  localStorage.removeItem(SESSION_KEY);
  chatLog.innerHTML = "";
  addMessage(
    "Szia! CloudFlow ügyfélszolgálat vagyok. Miben segíthetek ma — milyen kihívást szeretnél megoldani a csapatoddal?",
    "bot"
  );
  updatePhaseIndicator("discovery");
  if (chatMeta) {
    chatMeta.hidden = true;
    chatMeta.textContent = "";
  }
  chatInput.focus();
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
  if (chatReset) chatReset.disabled = isLoading;
}

function updatePhaseIndicator(phase) {
  if (!phaseTrack || !phase) return;

  var activeIndex = PHASE_ORDER.indexOf(phase);
  if (activeIndex < 0) activeIndex = 0;

  phaseTrack.querySelectorAll(".phase-step").forEach(function (step) {
    var stepPhase = step.getAttribute("data-phase");
    var stepIndex = PHASE_ORDER.indexOf(stepPhase);

    step.classList.remove("active", "done");
    if (stepIndex < activeIndex) {
      step.classList.add("done");
    } else if (stepIndex === activeIndex) {
      step.classList.add("active");
    }
  });
}

function updateChatMeta(data) {
  if (!chatMeta) return;
  var bits = [];
  if (data.score != null) bits.push("Score: " + data.score);
  if (data.recommendedProduct) bits.push("Csomag: " + data.recommendedProduct);
  if (data.leadId) bits.push("Lead mentve");
  if (!bits.length) {
    chatMeta.hidden = true;
    return;
  }
  chatMeta.hidden = false;
  chatMeta.textContent = bits.join(" · ");
}

async function handleSend() {
  var text = chatInput.value.trim();
  if (!text) return;

  addMessage(text, "user");
  chatInput.value = "";

  var thinkingMessage = addMessage("Gondolkodom...", "bot");
  setLoading(true);
  chatHint.hidden = true;

  try {
    var response = await fetch(API_BASE + "/api/chat", {
      method: "POST",
      headers: {
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        message: text,
        sessionId: getSessionId(),
        vertical: "saas"
      })
    });

    if (!response.ok) {
      throw new Error("Request failed: " + response.status);
    }

    var data = await response.json();

    if (data.sessionId) {
      localStorage.setItem(SESSION_KEY, data.sessionId);
    }

    thinkingMessage.textContent = data.reply || "Nem kaptam választ. Próbáld újra.";
    updatePhaseIndicator(data.phase || "discovery");
    updateChatMeta(data);
  } catch (error) {
    thinkingMessage.textContent =
      "A chat API jelenleg nem elérhető. Ellenőrizd a Vercel deployt és az API URL-t.";
    chatHint.hidden = false;
    console.error("Chat error:", error);
  } finally {
    setLoading(false);
    chatInput.focus();
  }
}

chatSend.addEventListener("click", handleSend);
chatInput.addEventListener("keydown", function (event) {
  if (event.key === "Enter") handleSend();
});

if (chatReset) {
  chatReset.addEventListener("click", resetSession);
}

document.querySelectorAll("a[href^='#']").forEach(function (link) {
  link.addEventListener("click", function (event) {
    var target = document.querySelector(link.getAttribute("href"));
    if (target) {
      event.preventDefault();
      target.scrollIntoView({ behavior: "smooth" });
    }
  });
});

updatePhaseIndicator("discovery");
