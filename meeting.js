var API_BASE = "https://jaffar-hu.vercel.app";
var SESSION_KEY = "jaffar_meeting_session";

var EXAMPLES = {
  sprint:
    "Sprint planning — 2026.07.14\nRésztvevők: Anna (PM), Bence (FE), Dóra (BE)\n\n" +
    "Megbeszéltük a Q3 roadmapet. Döntés: a billing refactor megy a következő sprintbe, a mobile app UI csúszik 2 hetet.\n" +
    "Anna: frissíti a Notion boardot holnapig.\n" +
    "Bence: prototype a checkout flow-ra péntekig.\n" +
    "Dóra: megírja az API contractot szerdáig, unresolved: kell-e webhook retry queue.\n" +
    "Kockázat: a staging DB migráció érintheti a demo környezetet.",
  sales:
    "Discovery hívás — North Soft\nRésztvevők: Éva (AE), Péter (CTO, North Soft)\n\n" +
    "Péter: 18 fős eng csapat, Jira + Excel mix, átláthatóság a fő fájdalom.\n" +
    "Budget kb. 80-100k Ft/hó. Döntés: küldünk Pro trial accesst.\n" +
    "Éva: demo időpontot egyeztet csütörtökre.\n" +
    "Péter elküldi a jelenlegi board exportot hétfőig.\n" +
    "Nyitott: SSO kell-e az első fázisban (valószínűleg nem)."
};

var meetInput = document.getElementById("meet-input");
var meetSend = document.getElementById("meet-send");
var meetClear = document.getElementById("meet-clear");
var chatLog = document.getElementById("chat-log");
var chatHint = document.getElementById("chat-hint");
var chatMeta = document.getElementById("chat-meta");
var meetingEmpty = document.getElementById("meeting-empty");
var meetingBody = document.getElementById("meeting-body");

function getSessionId() {
  var existing = localStorage.getItem(SESSION_KEY);
  if (existing) return existing;
  var id = "meet_" + Date.now() + "_" + Math.random().toString(36).slice(2, 10);
  localStorage.setItem(SESSION_KEY, id);
  return id;
}

function setStatus(text) {
  chatLog.innerHTML = "";
  if (!text) return;
  var msg = document.createElement("div");
  msg.className = "chat-message bot";
  msg.textContent = text;
  chatLog.appendChild(msg);
}

function fillList(el, items, mapper) {
  el.innerHTML = "";
  if (!items || !items.length) {
    var li = document.createElement("li");
    li.textContent = "—";
    el.appendChild(li);
    return;
  }
  items.forEach(function (item) {
    var li = document.createElement("li");
    li.textContent = mapper ? mapper(item) : item;
    el.appendChild(li);
  });
}

function renderMeeting(meeting) {
  if (!meeting) return;

  meetingEmpty.hidden = true;
  meetingBody.hidden = false;

  document.getElementById("m-title").textContent = meeting.title || "Meeting összefoglaló";
  document.getElementById("m-summary").textContent = meeting.summary || "—";
  fillList(document.getElementById("m-decisions"), meeting.decisions);
  fillList(document.getElementById("m-actions"), meeting.actionItems, function (item) {
    return item.task + " — " + (item.owner || "ismeretlen") + " / " + (item.due || "ismeretlen");
  });
  fillList(document.getElementById("m-questions"), meeting.openQuestions);
  document.getElementById("m-email").textContent = meeting.followUpEmail || "—";

  if (chatMeta) {
    chatMeta.hidden = false;
    chatMeta.textContent =
      (meeting.actionItems ? meeting.actionItems.length : 0) + " action item";
  }
}

function clearAll() {
  localStorage.removeItem(SESSION_KEY);
  meetInput.value = "";
  meetingEmpty.hidden = false;
  meetingBody.hidden = true;
  setStatus("");
  chatHint.hidden = true;
  if (chatMeta) {
    chatMeta.hidden = true;
    chatMeta.textContent = "";
  }
  meetInput.focus();
}

async function handleSend(presetText) {
  var text = (presetText || meetInput.value).trim();
  if (!text) return;

  if (presetText) {
    meetInput.value = presetText;
  }

  setStatus("Összefoglaló készül...");
  meetSend.disabled = true;
  meetInput.disabled = true;
  chatHint.hidden = true;

  try {
    var response = await fetch(API_BASE + "/api/summarize", {
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

    setStatus(data.reply || "Kész.");
    renderMeeting(data.meeting);
  } catch (error) {
    setStatus("A summarizer API jelenleg nem elérhető.");
    chatHint.hidden = false;
    console.error("Meeting error:", error);
  } finally {
    meetSend.disabled = false;
    meetInput.disabled = false;
  }
}

meetSend.addEventListener("click", function () {
  handleSend();
});

meetClear.addEventListener("click", clearAll);

document.querySelectorAll("#example-chips .chip").forEach(function (chip) {
  chip.addEventListener("click", function () {
    var key = chip.getAttribute("data-example");
    var text = EXAMPLES[key];
    if (text) handleSend(text);
  });
});
