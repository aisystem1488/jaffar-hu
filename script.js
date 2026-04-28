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
}

function handleSend() {
  var text = chatInput.value.trim();
  if (!text) return;
  addMessage(text, "user");
  chatInput.value = "";
  setTimeout(function () {
    addMessage("Ez még csak demo válasz. A valódi AI chatbot hamarosan érkezik.", "bot");
  }, 800);
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
