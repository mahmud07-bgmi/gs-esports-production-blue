// CONFIG: Set your Google Sheet URL here (published to web, not private)
const SHEET_URL = 'https://docs.google.com/spreadsheets/d/1gyzPFtG3ubxzrqGEtQI-dr4aiExDU6Fx0tzFS2W4iG8/';

function getGvizUrl(sheetUrl) {
  const match = sheetUrl.match(/\/d\/([a-zA-Z0-9-_]+)/);
  if (!match) return null;
  const sheetId = match[1];
  return `https://docs.google.com/spreadsheets/d/${sheetId}/gviz/tq?tqx=out:json`;
}

function parseGvizTable(json) {
  if (!json.table) return { headers: [], rows: [] };
  const headers = json.table.cols.map(col => col.label);
  const rows = json.table.rows.map(row =>
    row.c.map(cell => (cell ? cell.v : ''))
  );
  return { headers, rows };
}

function createAliveRectangles(count) {
  const total = 4;
  const isEliminated = count === 0;
  let html = '<div class="alive-rectangles">';

  for (let i = 0; i < total; i++) {
    html += `<div class="alive-rect-bar${i >= count ? ' dead' : ''}"></div>`;
  }

  if (isEliminated) {
    html += '<div class="alive-rect-strike"></div>';
  }

  html += '</div>';
  return html;
}

function renderTable(table, shouldShow) {
  const idx = key =>
    table.headers.findIndex(
      h => String(h).toLowerCase().replace(/\s/g, '_') === key
    );

  const srNoIdx = idx('sr_no');
  const teamLogoIdx = idx('team_logo');
  const teamInitialIdx = idx('team_initial');
  const playersAliveIdx = idx('players_alive');
  const finishPointsIdx = idx('finish_points'); // FIN
  const totalPointsIdx = idx('total_points');   // TOT. PTS
  const bluezoneIdx = idx('bluezone');

  // Sort rows by total_points desc, then finish_points desc, then players_alive desc, then sr_no
  const sortedRows = [...table.rows].sort((a, b) => {
    const aTotal = parseInt(a[totalPointsIdx], 10) || 0;
    const bTotal = parseInt(b[totalPointsIdx], 10) || 0;
    if (bTotal !== aTotal) return bTotal - aTotal;

    const aFinish = parseInt(a[finishPointsIdx], 10) || 0;
    const bFinish = parseInt(b[finishPointsIdx], 10) || 0;
    if (bFinish !== aFinish) return bFinish - aFinish;

    const aAlive = parseInt(a[playersAliveIdx], 10) || 0;
    const bAlive = parseInt(b[playersAliveIdx], 10) || 0;
    if (bAlive !== aAlive) return bAlive - aAlive;

    const aRank = parseInt(a[srNoIdx], 10) || 0;
    const bRank = parseInt(b[srNoIdx], 10) || 0;
    return aRank - bRank;
  });

  const displayRows = Array.from({ length: sortedRows.length }, (_, i) => ({
    rank: i + 1,
    ...sortedRows[i],
  }));

  let html = `
    <table class="table-alive">
      <thead>
        <tr>
          <th style="width: 40px;">#</th>
          <th class="team" style="width: 160px;">TEAM NAME</th>
          <th style="width: 70px;">ALIVE</th>
          <th style="width: 60px;">FIN</th>
          <th style="width: 80px;">TOT. PTS</th>
        </tr>
      </thead>
      <tbody>
  `;

  for (let i = 0; i < displayRows.length; i++) {
    const row = displayRows[i];
    const isBluezone = String(row[bluezoneIdx]).toLowerCase() === 'true';

    html += `<tr${isBluezone ? ' class="bluezone-blink"' : ''}>`;
    html += `<td>${row.rank}</td>`;
    html += `<td class="team"><img src="${row[teamLogoIdx] || ''}" alt="logo"><span>${row[teamInitialIdx] || ''}</span></td>`;
    html += `<td>${createAliveRectangles(parseInt(row[playersAliveIdx], 10) || 0)}</td>`;
    html += `<td>${row[finishPointsIdx] ?? 0}</td>`;
    html += `<td>${row[totalPointsIdx] ?? 0}</td>`;
    html += `</tr>`;
  }

  html += `</tbody></table>`;

  const container = document.getElementById('table-container');

  if (shouldShow) {
    container.style.display = "block";
    container.className = "table-container slide-in";
  } else {
    container.className = "table-container slide-out";
    setTimeout(() => {
      container.style.display = "none";
    }, 800);
  }

  container.innerHTML = html;
}

function updateVisibility(table) {
  if (!table.headers.length || !table.rows.length) return true;

  const playersAliveIdx = table.headers.findIndex(
    h => String(h).toLowerCase().replace(/\s/g, '_') === 'players_alive'
  );

  if (playersAliveIdx === -1) return true;

  const teamsWithPlayersAlive = table.rows.filter(row => {
    const aliveCount = parseInt(row[playersAliveIdx], 10) || 0;
    return aliveCount > 0;
  }).length;

  return teamsWithPlayersAlive > 4;
}

// Main logic
const gvizUrl = getGvizUrl(SHEET_URL);
let lastTable = { headers: [], rows: [] };

function fetchData() {
  fetch(gvizUrl)
    .then(res => res.text())
    .then(text => {
      const json = JSON.parse(
        text.substring(text.indexOf('{'), text.lastIndexOf('}') + 1)
      );

      lastTable = parseGvizTable(json);

      document.getElementById('loading').style.display = 'none';
      document.getElementById('error').style.display = 'none';

      if (!lastTable.headers.length || !lastTable.rows.length) {
        document.getElementById('nodata').style.display = '';
        document.getElementById('table-root').style.display = 'none';
        return;
      }

      document.getElementById('nodata').style.display = 'none';
      document.getElementById('table-root').style.display = '';

      const shouldShow = updateVisibility(lastTable);
      renderTable(lastTable, shouldShow);
    })
    .catch(() => {
      document.getElementById('loading').style.display = 'none';
      document.getElementById('error').style.display = '';
      document.getElementById('error').textContent = 'Failed to load data';
      document.getElementById('table-root').style.display = 'none';
    });
}

fetchData();
setInterval(fetchData, 2000);
