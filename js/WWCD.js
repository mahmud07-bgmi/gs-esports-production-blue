google.charts.load('current', { packages: ['corechart'] });
google.charts.setOnLoadCallback(init);

const sheetId = '1gyzPFtG3ubxzrqGEtQI-dr4aiExDU6Fx0tzFS2W4iG8';
const gid = '1956336669'; // WWCD sheet gid
const refreshEvery = 2000; // 2 seconds

let currentDataHash = '';

function init() {
  // Show the main container with animation
  setTimeout(() => {
    document.querySelector('.main-container').classList.add('show');
  }, 500);

  updateData();
  setInterval(updateData, refreshEvery);
}

function updateData() {
  // Use direct URL construction for Google Sheets
  const url = `https://docs.google.com/spreadsheets/d/${sheetId}/gviz/tq?gid=${gid}&headers=1&tq=SELECT%20*`;
  
  // Create script element for JSONP request
  const script = document.createElement('script');
  script.src = url;
  
  // Override the default google.visualization.Query.setResponse function
  const originalSetResponse = window.google?.visualization?.Query?.setResponse;
  
  window.google = window.google || {};
  window.google.visualization = window.google.visualization || {};
  window.google.visualization.Query = window.google.visualization.Query || {};
  
  window.google.visualization.Query.setResponse = function(response) {
    try {
      if (response.table && response.table.rows && response.table.rows.length > 0) {
        console.log('Raw WWCD response:', response.table);
        
        const row = response.table.rows[0]; // Get first row data
        console.log('WWCD Row data:', row.c);
        
        const wwcdData = {
          team_name: row.c[0]?.v || '',
          team_logo: row.c[1]?.v || '',
          p1_name: row.c[2]?.v || '',
          p1_kill: row.c[3]?.v || 0,
          p2_name: row.c[4]?.v || '',
          p2_kill: row.c[5]?.v || 0,
          p3_name: row.c[6]?.v || '',
          p3_kill: row.c[7]?.v || 0,
          p4_name: row.c[8]?.v || '',
          p4_kill: row.c[9]?.v || 0
        };

        console.log('Processed WWCD data:', wwcdData);

        // Create hash to check if data changed
        const dataHash = JSON.stringify(wwcdData);
        
        // Only update if data actually changed
        if (dataHash !== currentDataHash) {
          updateWWCDDisplay(wwcdData);
          currentDataHash = dataHash;
        }
      } else {
        console.log('No WWCD data found');
        // Clear display if no data
        clearWWCDDisplay();
      }
    } catch (error) {
      console.error('Error processing WWCD data:', error);
    }
    
    // Clean up
    if (script.parentNode) {
      document.head.removeChild(script);
    }
    
    // Restore original function if it existed
    if (originalSetResponse) {
      window.google.visualization.Query.setResponse = originalSetResponse;
    }
  };
  
  script.onerror = function() {
    console.error('Error loading WWCD Google Sheets data');
    if (script.parentNode) {
      document.head.removeChild(script);
    }
  };
  
  // Add script to head to trigger the request
  document.head.appendChild(script);
}

function updateWWCDDisplay(data) {
  // Update team info
  const teamLogo = document.getElementById('team-logo');
  const teamName = document.getElementById('team-name');
  
  if (data.team_logo) {
    teamLogo.src = data.team_logo;
    teamLogo.alt = data.team_name;
    teamLogo.style.display = 'block';
    
    // Handle image load error
    teamLogo.onerror = function() {
      this.style.display = 'none';
    };
  } else {
    teamLogo.style.display = 'none';
  }
  
  teamName.textContent = data.team_name || 'TEAM NAME';
  
  // Update player 1
  document.getElementById('p1-name').textContent = data.p1_name || 'PLAYER 1';
  document.getElementById('p1-kills').textContent = data.p1_kill || '0';
  
  // Update player 2
  document.getElementById('p2-name').textContent = data.p2_name || 'PLAYER 2';
  document.getElementById('p2-kills').textContent = data.p2_kill || '0';
  
  // Update player 3
  document.getElementById('p3-name').textContent = data.p3_name || 'PLAYER 3';
  document.getElementById('p3-kills').textContent = data.p3_kill || '0';
  
  // Update player 4
  document.getElementById('p4-name').textContent = data.p4_name || 'PLAYER 4';
  document.getElementById('p4-kills').textContent = data.p4_kill || '0';
  
  // Add animation effect when data updates
  animateDataUpdate();
}

function clearWWCDDisplay() {
  document.getElementById('team-logo').style.display = 'none';
  document.getElementById('team-name').textContent = 'TEAM NAME';
  
  document.getElementById('p1-name').textContent = 'PLAYER 1';
  document.getElementById('p1-kills').textContent = '0';
  
  document.getElementById('p2-name').textContent = 'PLAYER 2';
  document.getElementById('p2-kills').textContent = '0';
  
  document.getElementById('p3-name').textContent = 'PLAYER 3';
  document.getElementById('p3-kills').textContent = '0';
  
  document.getElementById('p4-name').textContent = 'PLAYER 4';
  document.getElementById('p4-kills').textContent = '0';
}

function animateDataUpdate() {
  // Add pulse animation to kill counts when data updates
  const killCounts = document.querySelectorAll('.kill-count');
  
  killCounts.forEach(killCount => {
    killCount.style.transform = 'scale(1.2)';
    killCount.style.transition = 'transform 0.3s ease';
    killCount.style.color = '#D95E32';
    
    setTimeout(() => {
      killCount.style.transform = 'scale(1)';
      killCount.style.color = '#F29849';
    }, 300);
  });
  
  // Add glow effect to team logo
  const teamLogo = document.getElementById('team-logo');
  teamLogo.style.boxShadow = '0 0 30px rgba(242, 152, 73, 0.8)';
  teamLogo.style.transition = 'box-shadow 0.5s ease';
  
  setTimeout(() => {
    teamLogo.style.boxShadow = 'none';
  }, 1000);
}
