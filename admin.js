var API_BASE = "https://jaffar-hu.vercel.app";
var PASS_KEY = "jaffar_admin_password";

var loginForm = document.getElementById("admin-login");
var passwordInput = document.getElementById("admin-password");
var logoutBtn = document.getElementById("admin-logout");
var errorEl = document.getElementById("admin-error");
var panel = document.getElementById("admin-panel");
var leadsBody = document.getElementById("leads-body");
var detail = document.getElementById("lead-detail");
var detailBody = document.getElementById("lead-detail-body");
var refreshBtn = document.getElementById("admin-refresh");

var cachedLeads = [];

function getPassword() {
  return sessionStorage.getItem(PASS_KEY) || "";
}

function setPassword(value) {
  if (value) {
    sessionStorage.setItem(PASS_KEY, value);
  } else {
    sessionStorage.removeItem(PASS_KEY);
  }
}

function showError(text) {
  errorEl.hidden = !text;
  errorEl.textContent = text || "";
}

function formatDate(iso) {
  if (!iso) return "—";
  try {
    return new Date(iso).toLocaleString("hu-HU");
  } catch (e) {
    return iso;
  }
}

function escapeHtml(value) {
  return String(value == null ? "" : value)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

function renderLeads(leads) {
  cachedLeads = leads || [];
  leadsBody.innerHTML = "";

  if (!cachedLeads.length) {
    leadsBody.innerHTML = '<tr><td colspan="7">Még nincs lead.</td></tr>';
    detail.hidden = true;
    return;
  }

  cachedLeads.forEach(function (lead, index) {
    var tr = document.createElement("tr");
    tr.className = "admin-row";
    tr.dataset.index = String(index);
    tr.innerHTML =
      "<td>" +
      escapeHtml(formatDate(lead.created_at)) +
      "</td><td>" +
      escapeHtml(lead.name || "—") +
      "</td><td>" +
      escapeHtml(lead.email || "—") +
      "</td><td>" +
      escapeHtml(lead.company || "—") +
      "</td><td>" +
      (lead.score != null ? escapeHtml(String(lead.score)) : "—") +
      "</td><td>" +
      escapeHtml(lead.recommended_product || "—") +
      "</td><td>" +
      escapeHtml(lead.phase || "—") +
      "</td>";
    leadsBody.appendChild(tr);
  });
}

function showLeadDetail(lead) {
  detail.hidden = false;
  var q = lead.qualification || {};
  detailBody.innerHTML =
    '<div class="detail-grid">' +
    "<div><strong>Név</strong><span>" +
    escapeHtml(lead.name || "—") +
    "</span></div>" +
    "<div><strong>Email</strong><span>" +
    escapeHtml(lead.email || "—") +
    "</span></div>" +
    "<div><strong>Cég</strong><span>" +
    escapeHtml(lead.company || "—") +
    "</span></div>" +
    "<div><strong>Score</strong><span>" +
    (lead.score != null ? escapeHtml(String(lead.score)) : "—") +
    "</span></div>" +
    "<div><strong>Csomag</strong><span>" +
    escapeHtml(lead.recommended_product || "—") +
    "</span></div>" +
    "<div><strong>Fázis</strong><span>" +
    escapeHtml(lead.phase || "—") +
    "</span></div>" +
    "</div>" +
    '<p class="detail-block"><strong>Összefoglaló</strong><br />' +
    escapeHtml(lead.summary || "—") +
    "</p>" +
    '<p class="detail-block"><strong>Következő lépés</strong><br />' +
    escapeHtml(lead.next_step || "—") +
    "</p>" +
    '<p class="detail-block"><strong>Minősítés</strong><br />' +
    "Csapat: " +
    escapeHtml(q.team_size || "—") +
    "<br />Budget: " +
    escapeHtml(q.budget || "—") +
    "<br />Sürgősség: " +
    escapeHtml(q.urgency || "—") +
    "<br />Eszközök: " +
    escapeHtml(q.current_tools || "—") +
    "<br />Pain: " +
    escapeHtml(q.pain_point || "—") +
    "</p>";
}

async function loadLeads() {
  var password = getPassword();
  if (!password) {
    panel.hidden = true;
    logoutBtn.hidden = true;
    return;
  }

  showError("");
  logoutBtn.hidden = false;

  try {
    var response = await fetch(API_BASE + "/api/leads", {
      headers: {
        "x-admin-password": password
      }
    });

    if (response.status === 401) {
      setPassword("");
      panel.hidden = true;
      logoutBtn.hidden = true;
      showError("Hibás jelszó.");
      return;
    }

    if (!response.ok) {
      var err = await response.json().catch(function () {
        return {};
      });
      throw new Error(err.error || "Lekérdezés sikertelen");
    }

    var data = await response.json();
    panel.hidden = false;
    renderLeads(data.leads || []);
  } catch (error) {
    showError(error.message || "Hiba a lead lekérdezésnél");
    panel.hidden = true;
  }
}

loginForm.addEventListener("submit", function (event) {
  event.preventDefault();
  var value = passwordInput.value.trim();
  if (!value) {
    showError("Add meg a jelszót.");
    return;
  }
  setPassword(value);
  passwordInput.value = "";
  loadLeads();
});

logoutBtn.addEventListener("click", function () {
  setPassword("");
  panel.hidden = true;
  logoutBtn.hidden = true;
  detail.hidden = true;
  showError("");
});

refreshBtn.addEventListener("click", loadLeads);

leadsBody.addEventListener("click", function (event) {
  var row = event.target.closest("tr.admin-row");
  if (!row) return;
  var index = Number(row.dataset.index);
  if (!cachedLeads[index]) return;
  showLeadDetail(cachedLeads[index]);
});

if (getPassword()) {
  loadLeads();
}
