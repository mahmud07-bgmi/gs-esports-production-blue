const SHEET_ID = "1gyzPFtG3ubxzrqGEtQI-dr4aiExDU6Fx0tzFS2W4iG8";
const SHEET_NAME = "Sheet1";
const TOTAL_SLOTS = 25;
const REFRESH_MS = 3000;
const TOP_LEFT_SLOT = 23;

const SHEET_URL =
  `https://docs.google.com/spreadsheets/d/${SHEET_ID}/gviz/tq?sheet=${encodeURIComponent(SHEET_NAME)}&tqx=out:json`;

const DEFAULT_LAYOUT = [
  { x: 90, y: 110 },
  { x: 452, y: 110 },
  { x: 814, y: 110 },
  { x: 1176, y: 110 },
  { x: 1538, y: 110 },

  { x: 90, y: 220 },
  { x: 452, y: 220 },
  { x: 814, y: 220 },
  { x: 1176, y: 220 },
  { x: 1538, y: 220 },

  { x: 90, y: 330 },
  { x: 452, y: 330 },
  { x: 814, y: 330 },
  { x: 1176, y: 330 },
  { x: 1538, y: 330 },

  { x: 90, y: 440 },
  { x: 452, y: 440 },
  { x: 814, y: 440 },
  { x: 1176, y: 440 },
  { x: 1538, y: 440 },

  { x: 90, y: 550 },
  { x: 452, y: 550 },
  { x: 814, y: 550 },
  { x: 1176, y: 550 },
  { x: 1538, y: 550 }
];

const overlay = document.getElementById("overlay");
const topLeftLogo = document.getElementById("topLeftLogo");

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

function getLogoRotationBySlot(slot) {
  const rotateMap = {
    23: 0
  };
  return rotateMap[slot] ?? 0;
}

function updateTopLeftLogo(logoUrl, slotNo) {
  if (!topLeftLogo) return;

  if (logoUrl) {
    topLeftLogo.src = logoUrl;
    topLeftLogo.style.display = "block";
  } else {
    topLeftLogo.removeAttribute("src");
    topLeftLogo.style.display = "none";
  }

  topLeftLogo.classList.remove("rotate-0", "rotate-90", "rotate-180", "rotate-270");
  topLeftLogo.classList.add(`rotate-${getLogoRotationBySlot(slotNo)}`);
}

function createSlotElement(index) {
  const slot = document.createElement("div");
  slot.className = "slot hidden";
  slot.id = `slot-${index}`;
  slot.style.left = `${DEFAULT_LAYOUT[index - 1].x}px`;
  slot.style.top = `${DEFAULT_LAYOUT[index - 1].y}px`;

  const baseImg = document.createElement("img");
  baseImg.className = "base-img";
  baseImg.alt = "";
  baseImg.src = getBgBySlot(index);

  const logoWrap = document.createElement("div");
  logoWrap.className = "logo-wrap";

  const logo = document.createElement("img");
  logo.className = "logo";
  logo.alt = "";

  const teamName = document.createElement("div");
  teamName.className = "team-name";
  teamName.textContent = `TEAM ${index}`;

  logoWrap.appendChild(logo);
  slot.appendChild(baseImg);
  slot.appendChild(logoWrap);
  slot.appendChild(teamName);
  overlay.appendChild(slot);
}

function initSlots() {
  for (let i = 1; i <= TOTAL_SLOTS; i++) {
    createSlotElement(i);
  }
}

function updateSlot(slotNo, data) {
  const el = document.getElementById(`slot-${slotNo}`);
  if (!el) return;

  const baseImg = el.querySelector(".base-img");
  const logo = el.querySelector(".logo");
  const teamName = el.querySelector(".team-name");

  baseImg.src = getBgBySlot(slotNo);
  teamName.textContent = data.team_name || `TEAM ${slotNo}`;

  if (data.logo_url) {
    logo.src = data.logo_url;
    logo.style.display = "block";
  } else {
    logo.removeAttribute("src");
    logo.style.display = "none";
  }

  if (data.show === "1") {
    el.classList.remove("hidden");
  } else {
    el.classList.add("hidden");
  }
}

async function loadData() {
  try {
    const res = await fetch(SHEET_URL, { cache: "no-store" });
    const text = await res.text();
    const json = parseGViz(text);
    const rows = json.table.rows || [];
    const seen = new Set();

    let topLeftFound = false;

    rows.forEach((row) => {
      const slot_no = numberValue(row.c[0], 0);
      if (slot_no < 1 || slot_no > TOTAL_SLOTS) return;

      const data = {
        team_name: textValue(row.c[1]),
        logo_url: textValue(row.c[3]),
        show: "1"
      };

      updateSlot(slot_no, data);
      seen.add(slot_no);

      if (slot_no === TOP_LEFT_SLOT) {
        updateTopLeftLogo(data.logo_url, slot_no);
        topLeftFound = true;
      }
    });

    for (let i = 1; i <= TOTAL_SLOTS; i++) {
      if (!seen.has(i)) {
        updateSlot(i, {
          team_name: `TEAM ${i}`,
          logo_url: "",
          show: "0"
        });
      }
    }

    if (!topLeftFound) {
      updateTopLeftLogo("", TOP_LEFT_SLOT);
    }
  } catch (error) {
    console.error("Sheet load failed:", error);
  }
}

initSlots();
loadData();
setInterval(loadData, REFRESH_MS);
