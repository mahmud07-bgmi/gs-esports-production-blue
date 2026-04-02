const SHEET_ID = "1gyzPFtG3ubxzrqGEtQI-dr4aiExDU6Fx0tzFS2W4iG8";
const APPS_SCRIPT_URL = "PASTE_YOUR_APPS_SCRIPT_WEBAPP_URL_HERE";

const TEAMS_URL =
  `https://docs.google.com/spreadsheets/d/${SHEET_ID}/gviz/tq?sheet=Teams&tqx=out:json`;

const teamGrid = document.getElementById("teamGrid");
const selectedSlotText = document.getElementById("selectedSlotText");
const showStateText = document.getElementById("showStateText");
const showBtn = document.getElementById("showBtn");
const hideBtn = document.getElementById("hideBtn");

let selectedSlot = null;
let visibleState = false;
let currentRows = [];

function safeValue(cell) {
  return cell && cell.v !== null && cell.v !== undefined ? cell.v : "";
}

function textValue(cell) {
  return String(safeValue(cell)).trim();
}

function numberValue(cell, fallback = 0) {
  const n = Number(safeValue(cell));
  return Number.isFinite(n) ? n : fallback;
}

function parseGViz(text) {
  return JSON.parse(text.substring(47).slice(0, -2));
}

async function loadTeams() {
  const res = await fetch(TEAMS_URL, { cache: "no-store" });
  const text = await res.text();
  const json = parseGViz(text);
  return json.table.rows || [];
}

function updateStatus() {
  selectedSlotText.textContent = selectedSlot ?? "-";
  showStateText.textContent = visibleState ? "Visible" : "Hidden";
}

function renderCards(rows) {
  teamGrid.innerHTML = "";

  rows.forEach((row) => {
    const slot = numberValue(row.c[0], 0);
    const name = textValue(row.c[1]);
    const logo = textValue(row.c[3]);

    if (!slot) return;

    const card = document.createElement("div");
    card.className = "team-card" + (slot === selectedSlot ? " active" : "");

    card.innerHTML = `
      <div class="slot-label">SLOT ${slot}</div>
      <img class="card-logo" src="${logo}" alt="">
      <div class="card-name">${name || `SLOT ${slot}`}</div>
    `;

    card.addEventListener("click", () => {
      selectedSlot = slot;
      updateStatus();
      renderCards(currentRows);
    });

    teamGrid.appendChild(card);
  });
}

async function sendControl(slot, show) {
  if (!APPS_SCRIPT_URL || APPS_SCRIPT_URL === "PASTE_YOUR_APPS_SCRIPT_WEBAPP_URL_HERE") {
    alert("Apps Script URL daalo pehle.");
    return;
  }

  await fetch(APPS_SCRIPT_URL, {
    method: "POST",
    headers: {
      "Content-Type": "text/plain;charset=utf-8"
    },
    body: JSON.stringify({
      selected_slot: slot,
      show: show
    })
  });
}

showBtn.addEventListener("click", async () => {
  if (!selectedSlot) {
    alert("Pehle team card pe click karo.");
    return;
  }

  visibleState = true;
  updateStatus();
  await sendControl(selectedSlot, 1);
});

hideBtn.addEventListener("click", async () => {
  if (!selectedSlot) {
    alert("Pehle team card pe click karo.");
    return;
  }

  visibleState = false;
  updateStatus();
  await sendControl(selectedSlot, 0);
});

(async function init() {
  currentRows = await loadTeams();
  renderCards(currentRows);
  updateStatus();
})();
