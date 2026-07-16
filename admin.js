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
      formatDate(lead.created_at) +
      "</td><td>" +
      (lead.name || "—") +
      "</td><td>" +
      (lead.email || "—") +
      "</td><td>" +
      (lead.company || "—") +
      "</td><td>" +
      (lead.score != null ? lead.score : "—") +
      "</td><td>" +
      (lead.recommended_product || "—") +
      "</td><td>" +
      (lead.phase || "—") +
      "</td>";
    leadsBody.appendChild(tr);
  });
}

function showLeadDetail(lead) {
  detail.hidden = false;
  detailBody.textContent = JSON.stringify(
    {
      name: lead.name,
      email: lead.email,
      company: lead.company,
      score: lead.score,
      recommended_product: lead.recommended_product,
      phase: lead.phase,
      summary: lead.summary,
      next_step: lead.next_step,
      qualification: lead.qualification,
      session_id: lead.session_id,
      conversation_id: lead.conversation_id,
      created_at: lead.created_at
    },
    null,
    2
  );
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
