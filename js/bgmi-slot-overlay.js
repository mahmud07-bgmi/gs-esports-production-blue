const SHEET_ID = "1gyzPFtG3ubxzrqGEtQI-dr4aiExDU6Fx0tzFS2W4iG8";
const REFRESH_MS = 2000;

const TEAMS_URL =
  `https://docs.google.com/spreadsheets/d/${SHEET_ID}/gviz/tq?sheet=Teams&tqx=out:json`;

const CONTROL_URL =
  `https://docs.google.com/spreadsheets/d/${SHEET_ID}/gviz/tq?sheet=Control&tqx=out:json`;

const teamCard = document.getElementById("teamCard");
const bgImg = document.getElementById("bgImg");
const teamLogo = document.getElementById("teamLogo");
const teamName = document.getElementById("teamName");

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

async function getRows(url) {
  const res = await fetch(url, { cache: "no-store" });
  const text = await res.text();
  const json = parseGViz(text);
  return json.table.rows || [];
}

async function loadOverlay() {
  try {
    const [teamsRows, controlRows] = await Promise.all([
      getRows(TEAMS_URL),
      getRows(CONTROL_URL)
    ]);

    if (!controlRows.length) {
      teamCard.classList.add("hidden");
      return;
    }

    const controlRow = controlRows[0];
    const selectedSlot = numberValue(controlRow.c[0], 0);
    const show = textValue(controlRow.c[1]);

    if (show !== "1" || selectedSlot < 1) {
      teamCard.classList.add("hidden");
      return;
    }

    const selectedTeam = teamsRows.find(row => numberValue(row.c[0], 0) === selectedSlot);

    if (!selectedTeam) {
      teamCard.classList.add("hidden");
      return;
    }

    const name = textValue(selectedTeam.c[1]);
    const logo = textValue(selectedTeam.c[3]);

    teamName.textContent = name || `SLOT ${selectedSlot}`;
    teamLogo.src = logo || "";
    bgImg.src = getBgBySlot(selectedSlot);

    if (logo) {
      teamLogo.style.display = "block";
    } else {
      teamLogo.style.display = "none";
    }

    teamCard.classList.remove("hidden");
  } catch (err) {
    console.error("Overlay load failed:", err);
    teamCard.classList.add("hidden");
  }
}

loadOverlay();
setInterval(loadOverlay, REFRESH_MS);
