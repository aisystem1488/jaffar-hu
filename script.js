/**
 * script.js – jaffar.hu demo foundation
 *
 * Currently handles:
 *  1. Contact / lead-capture form submission (console + status message)
 *  2. Demo chatbot UI (static responses for now)
 *
 * Future integrations:
 *  - n8n webhook for form data
 *  - Google Sheets / email automation
 *  - Real AI chatbot API (e.g. OpenAI)
 */

/* ===== Contact form ===== */
const contactForm = document.getElementById('contact-form');
const formStatus  = document.getElementById('form-status');

if (contactForm) {
  contactForm.addEventListener('submit', function (e) {
    e.preventDefault();

    const name    = document.getElementById('name').value.trim();
    const email   = document.getElementById('email').value.trim();
    const message = document.getElementById('message').value.trim();

    if (!name || !email || !message) {
      showStatus('Please fill in all fields.', 'error');
      return;
    }

    const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailPattern.test(email)) {
      showStatus('Please enter a valid email address.', 'error');
      return;
    }

    // TODO: replace with real n8n webhook or API call
    console.log('Form submitted:', { name, email, message });

    showStatus('Thanks, ' + name + '! Your message was received. 🎉', 'success');
    contactForm.reset();
  });
}

function showStatus(msg, type) {
  if (!formStatus) return;
  formStatus.textContent = msg;
  formStatus.className   = 'form-status ' + type;
  setTimeout(() => {
    formStatus.textContent = '';
    formStatus.className   = 'form-status';
  }, 5000);
}

/* ===== Demo chatbot ===== */
const chatInput  = document.getElementById('chat-input');
const chatSend   = document.getElementById('chat-send');
const chatWindow = document.getElementById('chat-messages');

const botReplies = [
  "Hi! I'm Jaffar, your AI demo assistant. 🤖",
  "This chatbot is just a demo for now – real AI integration coming soon!",
  "You can connect me to an OpenAI API or an n8n workflow later.",
  "Ask me anything – I'll do my best (within demo limits 😄).",
  "Great question! The answer will be powered by AI in the next phase.",
];

let replyIndex = 0;

function sendMessage() {
  if (!chatInput || !chatWindow) return;

  const text = chatInput.value.trim();
  if (!text) return;

  appendBubble(text, 'user');
  chatInput.value = '';

  setTimeout(() => {
    const reply = botReplies[replyIndex % botReplies.length];
    replyIndex++;
    appendBubble(reply, 'bot');
  }, 600);
}

function appendBubble(text, role) {
  const bubble = document.createElement('div');
  bubble.className = 'chat-bubble ' + role;
  bubble.textContent = text;
  chatWindow.appendChild(bubble);
  chatWindow.scrollTop = chatWindow.scrollHeight;
}

if (chatSend) {
  chatSend.addEventListener('click', sendMessage);
}

if (chatInput) {
  chatInput.addEventListener('keydown', function (e) {
    if (e.key === 'Enter') sendMessage();
  });
}
