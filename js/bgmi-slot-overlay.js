const SHEET_ID = "1gyzPFtG3ubxzrqGEtQI-dr4aiExDU6Fx0tzFS2W4iG8";
const FORCE_SLOT = 1;

const TEAMS_URL =
  `https://docs.google.com/spreadsheets/d/${SHEET_ID}/gviz/tq?sheet=Teams&tqx=out:json`;

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

async function init() {
  try {
    bgImg.src = getBgBySlot(FORCE_SLOT);

    const res = await fetch(TEAMS_URL, { cache: "no-store" });
    const text = await res.text();
    const json = parseGViz(text);
    const teams = json.table.rows || [];

    const selectedTeam = teams.find(
      row => numberValue(row.c[0], 0) === FORCE_SLOT
    );

    if (selectedTeam) {
      const name = textValue(selectedTeam.c[1]);
      const logo = textValue(selectedTeam.c[3]);

      teamName.textContent = name || `SLOT ${FORCE_SLOT}`;

      if (logo) {
        teamLogo.src = logo;
        teamLogo.style.display = "block";
      } else {
        teamLogo.style.display = "none";
      }
    } else {
      teamName.textContent = `SLOT ${FORCE_SLOT}`;
      teamLogo.style.display = "none";
    }
  } catch (err) {
    console.error(err);
    bgImg.src = getBgBySlot(FORCE_SLOT);
    teamName.textContent = "OBS LOAD ERROR";
    teamLogo.style.display = "none";
  }
}

init();
