// Charts.js — Commodity line chart renderer. Supports single and dual-line combined charts.
function renderSingleChart(canvasId, commodity) {
  var ctx = document.getElementById(canvasId);
  if (!ctx) return;
  var pts = commodity.history || [];
  var lbls = commodity.labels || [];
  if (pts.length < 2) {
    ctx.parentElement.innerHTML = '<div style="text-align:center;padding:60px 0;color:#6c6c80;font-size:13px;">Insufficient data</div>';
    return;
  }
  new Chart(ctx, {
    type: 'line',
    data: {
      labels: lbls,
      datasets: [{
        label: commodity.name + ' (' + commodity.unit + ')',
        data: pts,
        borderColor: commodity.color || '#4fc3f7',
        backgroundColor: commodity.color || '#4fc3f7',
        borderWidth: 2, fill: false, tension: 0.1,
        pointBackgroundColor: commodity.color || '#4fc3f7',
        pointBorderColor: '#1a1a2e', pointBorderWidth: 1,
        pointRadius: pts.length > 15 ? 2 : 3
      }]
    },
    options: {
      responsive: true, maintainAspectRatio: false,
      plugins: {
        legend: { display: false },
        tooltip: {
          backgroundColor: '#1a1a2e', titleColor: '#e0e0e0', bodyColor: '#e0e0e0',
          borderColor: '#2a2a45', borderWidth: 1, padding: 10, cornerRadius: 6,
          callbacks: {
            title: function(items) { return items[0].label; },
            label: function(t) { return t.dataset.label + ': ' + t.parsed.y; }
          }
        }
      },
      scales: {
        x: { grid: { color: 'rgba(255,255,255,0.04)', drawBorder: false }, ticks: { color: '#6c6c80', font: { size: 10 }, maxRotation: 45 } },
        y: { display: false, grid: { display: false }, ticks: { display: false } }
      },
      elements: { point: { radius: 3, hoverRadius: 5 } }
    }
  });
}

// Dual-line combined chart (e.g. Ammonia CFR + FOB on one canvas)
function renderCombinedChart(canvasId, group, commodities) {
  var ctx = document.getElementById(canvasId);
  if (!ctx) return;

  var datasets = [];
  var allLabels = [];
  commodities.forEach(function(c) {
    var pts = c.history || [];
    var lbls = c.labels || [];
    if (pts.length < 2) return;
    if (lbls.length > allLabels.length) allLabels = lbls;
    datasets.push({
      label: c.name + ' (' + c.unit + ')',
      data: pts,
      borderColor: c.color || '#4fc3f7',
      backgroundColor: c.color || '#4fc3f7',
      borderWidth: 2, fill: false, tension: 0.1,
      pointBackgroundColor: c.color || '#4fc3f7',
      pointBorderColor: '#1a1a2e', pointBorderWidth: 1,
      pointRadius: pts.length > 15 ? 2 : 3
    });
  });

  if (datasets.length < 1) {
    ctx.parentElement.innerHTML = '<div style="text-align:center;padding:60px 0;color:#6c6c80;font-size:13px;">Insufficient data</div>';
    return;
  }

  new Chart(ctx, {
    type: 'line',
    data: { labels: allLabels, datasets: datasets },
    options: {
      responsive: true, maintainAspectRatio: false,
      interaction: { mode: 'index', intersect: false },
      plugins: {
        legend: {
          display: true,
          labels: { color: '#a0a0b0', font: { size: 11 }, boxWidth: 12, padding: 12 }
        },
        tooltip: {
          backgroundColor: '#1a1a2e', titleColor: '#e0e0e0', bodyColor: '#e0e0e0',
          borderColor: '#2a2a45', borderWidth: 1, padding: 10, cornerRadius: 6,
          callbacks: {
            title: function(items) { return items[0].label; },
            label: function(t) { return t.dataset.label + ': ' + t.parsed.y; }
          }
        }
      },
      scales: {
        x: { grid: { color: 'rgba(255,255,255,0.04)', drawBorder: false }, ticks: { color: '#6c6c80', font: { size: 10 }, maxRotation: 45 } },
        y: { display: false, grid: { display: false }, ticks: { display: false } }
      },
      elements: { point: { radius: 3, hoverRadius: 5 } }
    }
  });
}

// Render all charts for a sector panel
function renderSectorCharts(panel, sector) {
  var commodities = sector.commodities || [];
  var chartGroups = sector.chart_groups || [];
  var grid = panel.querySelector('.chart-grid');
  grid.innerHTML = '';

  // Track which commodities are in chart groups (skip individual chart)
  var groupedNames = {};
  chartGroups.forEach(function(g) {
    (g.commodities || []).forEach(function(n) { groupedNames[n] = true; });
  });

  // Render combined chart groups first
  chartGroups.forEach(function(g, gi) {
    var members = g.commodities.map(function(n) { return commodities.find(function(c) { return c.name === n; }); }).filter(Boolean);
    if (members.length < 2) return;

    var card = document.createElement('div');
    card.className = 'chart-card chart-card-wide';

    var h3 = document.createElement('h3');
    h3.textContent = g.title || members.map(function(m) { return m.name; }).join(' vs ');
    card.appendChild(h3);

    var wr = document.createElement('div');
    wr.className = 'chart-wrapper';
    var cv = document.createElement('canvas');
    cv.id = 'group-chart-' + panel.dataset.sector + '-' + gi;
    wr.appendChild(cv);
    card.appendChild(wr);
    grid.appendChild(card);

    requestAnimationFrame(function() {
      renderCombinedChart('group-chart-' + panel.dataset.sector + '-' + gi, g, members);
    });
  });

  // Render individual commodity charts (skip grouped ones)
  commodities.forEach(function(c, i) {
    if (groupedNames[c.name]) return;
    var card = document.createElement('div');
    card.className = 'chart-card';
    var h3 = document.createElement('h3');
    var dotColor = c.color || '#4fc3f7';
    h3.innerHTML = '<span style="color:' + dotColor + ';">\u25cf</span> ' + c.name + ' <span class="price-tag">' + fmtPrice(c.price) + ' <span style="color:#6c6c80;font-weight:400;font-size:11px;">' + c.unit + '</span></span>';
    card.appendChild(h3);
    var wr = document.createElement('div');
    wr.className = 'chart-wrapper';
    var cv = document.createElement('canvas');
    cv.id = 'chart-' + panel.dataset.sector + '-' + i;
    wr.appendChild(cv);
    card.appendChild(wr);
    grid.appendChild(card);

    requestAnimationFrame(function() {
      renderSingleChart('chart-' + panel.dataset.sector + '-' + i, c);
    });
  });
}

function fmtPrice(v) {
  if (v === null || v === undefined) return '\u2014';
  if (v >= 10000) return Number(v).toLocaleString('en-US', { minimumFractionDigits: 0 });
  if (v >= 100) return Number(v).toLocaleString('en-US', { minimumFractionDigits: 1 });
  return Number(v).toLocaleString('en-US', { minimumFractionDigits: 2 });
}
