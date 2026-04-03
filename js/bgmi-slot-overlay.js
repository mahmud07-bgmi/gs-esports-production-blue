const SHEET_ID = "1gyzPFtG3ubxzrqGEtQI-dr4aiExDU6Fx0tzFS2W4iG8";
const STORAGE_KEY = "bgmi_slot_overlay_state";
const REFRESH_MS = 1000;

const TEAMS_URL =
  `https://docs.google.com/spreadsheets/d/${SHEET_ID}/gviz/tq?sheet=Teams&tqx=out:json`;

const teamCard = document.getElementById("teamCard");
const bgImg = document.getElementById("bgImg");
const teamLogo = document.getElementById("teamLogo");
const teamName = document.getElementById("teamName");

let teams = [];

// ---------- Helpers ----------
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

// ---------- State ----------
function getOverlayState() {
  try {
    return JSON.parse(localStorage.getItem(STORAGE_KEY) || "{}");
  } catch {
    return {};
  }
}

// ---------- Load Teams ----------
async function loadTeams() {
  try {
    const res = await fetch(TEAMS_URL, { cache: "no-store" });
    const text = await res.text();
    const json = parseGViz(text);
    teams = json.table.rows || [];
  } catch (err) {
    console.error("Sheet load error:", err);
  }
}

// ---------- Render ----------
function renderOverlay() {
  const state = getOverlayState();

  // 🔥 OBS FIX → default slot = 1
  const selectedSlot = Number(state.selectedSlot || 1);

  const selectedTeam = teams.find(
    row => numberValue(row.c[0], 0) === selectedSlot
  );

  if (!selectedTeam) {
    console.warn("Team not found for slot:", selectedSlot);
    teamCard.classList.add("hidden");
    return;
  }

  const name = textValue(selectedTeam.c[1]);
  const logo = textValue(selectedTeam.c[3]);

  // Team Name
  teamName.textContent = name || `SLOT ${selectedSlot}`;

  // Background (slot wise)
  bgImg.src = getBgBySlot(selectedSlot);

  // Logo
  if (logo) {
    teamLogo.src = logo;
    teamLogo.style.display = "block";
  } else {
    teamLogo.removeAttribute("src");
    teamLogo.style.display = "none";
  }

  // Show card
  teamCard.classList.remove("hidden");
}

// ---------- Init ----------
async function init() {
  await loadTeams();
  renderOverlay();

  // OBS me kabhi-kabhi storage update detect nahi hota
  window.addEventListener("storage", renderOverlay);

  // 🔁 Auto refresh (important for OBS)
  setInterval(() => {
    renderOverlay();
  }, REFRESH_MS);
}

init();
