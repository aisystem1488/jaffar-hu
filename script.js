console.log("Jaffar.hu landing page loaded");

var chatLog = document.getElementById("chat-log");
var chatInput = document.getElementById("chat-input");
var chatSend = document.getElementById("chat-send");

function addMessage(text, role) {
  var msg = document.createElement("div");
  msg.className = "chat-message " + role;
  msg.textContent = text;
  chatLog.appendChild(msg);
  chatLog.scrollTop = chatLog.scrollHeight;
  return msg;
}

async function handleSend() {
  var text = chatInput.value.trim();
  if (!text) return;

  addMessage(text, "user");
  chatInput.value = "";

  var thinkingMessage = addMessage("Gondolkodom...", "bot");

  try {
    var response = await fetch("https://jaffar-hu.app.n8n.cloud/webhook-test/jaffar-chat", {
      method: "POST",
      headers: {
        "Content-Type": "application/json"
      },
      body: JSON.stringify({ message: text })
    });

    if (!response.ok) {
      throw new Error("Request failed");
    }

    var data = await response.json();
    thinkingMessage.textContent = data.reply || "Hiba történt. Kérlek próbáld újra később.";
  } catch (error) {
    thinkingMessage.textContent = "Hiba történt. Kérlek próbáld újra később.";
  }
}

chatSend.addEventListener("click", handleSend);
chatInput.addEventListener("keydown", function (event) {
  if (event.key === "Enter") handleSend();
});

document.querySelectorAll(".hero-actions a[href^='#']").forEach(function (link) {
  link.addEventListener("click", function (event) {
    var target = document.querySelector(link.getAttribute("href"));
    if (target) {
      event.preventDefault();
      target.scrollIntoView({ behavior: "smooth" });
    }
  });
});
