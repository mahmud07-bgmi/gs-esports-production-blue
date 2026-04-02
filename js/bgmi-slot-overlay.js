const SHEET_ID = "1gyzPFtG3ubxzrqGEtQI-dr4aiExDU6Fx0tzFS2W4iG8";
const STORAGE_KEY = "bgmi_slot_overlay_state";
const REFRESH_MS = 500;

const TEAMS_URL =
  `https://docs.google.com/spreadsheets/d/${SHEET_ID}/gviz/tq?sheet=Teams&tqx=out:json`;

const teamCard = document.getElementById("teamCard");
const bgImg = document.getElementById("bgImg");
const teamLogo = document.getElementById("teamLogo");
const teamName = document.getElementById("teamName");

let teams = [];

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

function getBgBySlot(slot) {
  return `assets/${slot}.png`;
}

function getOverlayState() {
  try {
    return JSON.parse(localStorage.getItem(STORAGE_KEY) || "{}");
  } catch {
    return {};
  }
}

async function loadTeams() {
  const res = await fetch(TEAMS_URL, { cache: "no-store" });
  const text = await res.text();
  const json = parseGViz(text);
  teams = json.table.rows || [];
}

function renderOverlay() {
  const state = getOverlayState();
  const selectedSlot = Number(state.selectedSlot || 0);

  if (!selectedSlot) {
    teamCard.classList.add("hidden");
    return;
  }

  const selectedTeam = teams.find(row => numberValue(row.c[0], 0) === selectedSlot);

  if (!selectedTeam) {
    teamCard.classList.add("hidden");
    return;
  }

  const name = textValue(selectedTeam.c[1]);
  const logo = textValue(selectedTeam.c[3]);

  teamName.textContent = name || `SLOT ${selectedSlot}`;
  bgImg.src = getBgBySlot(selectedSlot);

  if (logo) {
    teamLogo.src = logo;
    teamLogo.style.display = "block";
  } else {
    teamLogo.style.display = "none";
    teamLogo.removeAttribute("src");
  }

  teamCard.classList.remove("hidden");
}

(async function init() {
  await loadTeams();
  renderOverlay();
  window.addEventListener("storage", renderOverlay);
  setInterval(renderOverlay, REFRESH_MS);
})();
