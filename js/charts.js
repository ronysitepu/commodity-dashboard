// Charts.js — Commodity line chart renderer. Aligned date axis + right-side y-axis.
//
// Axis source of truth is sector.axis (the dense YTD daily grid exported by
// export_commodity_data.py). It is passed through in insertion order — the old
// "pool the labels and sort by dd/mm" path scrambled any window longer than a
// month (01/02 sorted before 05/01), which is fatal now the window is YTD.
function alignCommoditiesToAxis(commodities, unifiedLabels) {
  return commodities.map(function(c) {
    var pts = c.history || [];
    var lbls = c.labels || [];
    var offset = pts.length - lbls.length;
    var lookup = {};
    for (var i = 0; i < lbls.length; i++) lookup[lbls[i]] = pts[offset + i];
    return unifiedLabels.map(function(l) {
      return lookup[l] !== undefined ? lookup[l] : null;
    });
  });
}

function axisTicks(count) {
  return {
    color: '#6c6c80', font: { size: 10 },
    maxRotation: 0, autoSkip: true,
    maxTicksLimit: count > 120 ? 12 : (count > 40 ? 8 : 12)
  };
}

function pointRadius(ptCount, freq) {
  if (freq === 'monthly') return 3;
  return ptCount > 60 ? 0 : (ptCount > 15 ? 2 : 3);
}

function xScale(labels) {
  return {
    grid: { color: 'rgba(255,255,255,0.04)', drawBorder: false },
    ticks: axisTicks(labels.length)
  };
}

function renderSingleChart(canvasId, commodity, fixedLabels, alignedData) {
  var ctx = document.getElementById(canvasId);
  if (!ctx) return;
  var pts = alignedData || commodity.history || [];
  var lbls = fixedLabels || commodity.labels || [];
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
        pointRadius: pointRadius(pts.length, commodity.freq),
        pointHoverRadius: 5,
        spanGaps: true
      }]
    },
    options: {
      responsive: true, maintainAspectRatio: false,
      interaction: { mode: 'index', intersect: false },
      plugins: {
        legend: { display: false },
        tooltip: {
          backgroundColor: '#1a1a2e', titleColor: '#e0e0e0', bodyColor: '#e0e0e0',
          borderColor: '#2a2a45', borderWidth: 1, padding: 10, cornerRadius: 6,
          callbacks: {
            title: function(items) { return items[0].label; },
            label: function(t) {
              if (t.parsed.y === null) return null;
              return t.dataset.label + ': ' + t.parsed.y;
            }
          }
        }
      },
      scales: {
        x: xScale(lbls),
        y: { display: true, position: 'right', grid: { color: 'rgba(255,255,255,0.04)' }, ticks: { color: '#6c6c80', font: { size: 10 } } }
      },
      elements: { point: { radius: 3, hoverRadius: 5 } }
    }
  });
}

function renderCombinedChart(canvasId, group, commodities, fixedLabels, alignedDatasets) {
  var ctx = document.getElementById(canvasId);
  if (!ctx) return;

  var datasets = [];
  var allLabels = fixedLabels || [];

  if (alignedDatasets) {
    for (var i = 0; i < commodities.length; i++) {
      var c = commodities[i];
      var pts = alignedDatasets[i] || [];
      if (pts.length < 2) continue;
      datasets.push({
        label: c.name + ' (' + c.unit + ')',
        data: pts,
        borderColor: c.color || '#4fc3f7',
        backgroundColor: c.color || '#4fc3f7',
        borderWidth: 2, fill: false, tension: 0.1,
        pointBackgroundColor: c.color || '#4fc3f7',
        pointBorderColor: '#1a1a2e', pointBorderWidth: 1,
        pointRadius: pointRadius(pts.length, c.freq),
        pointHoverRadius: 5,
        spanGaps: true
      });
    }
  } else {
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
        pointRadius: pointRadius(pts.length, c.freq),
        pointHoverRadius: 5,
        spanGaps: true
      });
    });
  }

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
            label: function(t) {
              if (t.parsed.y === null) return null;
              return t.dataset.label + ': ' + t.parsed.y;
            }
          }
        }
      },
      scales: {
        x: xScale(allLabels),
        y: { display: true, position: 'right', grid: { color: 'rgba(255,255,255,0.04)' }, ticks: { color: '#6c6c80', font: { size: 10 } } }
      },
      elements: { point: { radius: 3, hoverRadius: 5 } }
    }
  });
}

// Small honest label: how often this series really prints, and where its line
// starts when it does not cover the whole window.
function coverageNote(c) {
  var bits = [];
  if (c.freq === 'monthly') bits.push('monthly prints');
  else if (c.freq === 'mixed') bits.push('monthly benchmark');
  if (c.ytd_from && c.change_ytd === null) bits.push('from ' + c.ytd_from.slice(8) + '/' + c.ytd_from.slice(5, 7));
  return bits.length ? '<span class="src-note">' + bits.join(' \u00b7 ') + '</span>' : '';
}

function renderSectorCharts(panel, sector) {
  var commodities = sector.commodities || [];
  var chartGroups = sector.chart_groups || [];
  var grid = panel.querySelector('.chart-grid');
  grid.innerHTML = '';

  var unifiedLabels;
  if (sector.axis && sector.axis.length) {
    unifiedLabels = sector.axis;
  } else {
    var allLabels = [];
    commodities.forEach(function(c) {
      (c.labels || []).forEach(function(l) {
        if (allLabels.indexOf(l) === -1) allLabels.push(l);
      });
    });
    unifiedLabels = allLabels;
  }

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
    h3.innerHTML = '<span>' + (g.title || members.map(function(m) { return m.name; }).join(' vs ')) + '</span>' + coverageNote(members[0]);
    card.appendChild(h3);

    var wr = document.createElement('div');
    wr.className = 'chart-wrapper';
    var cv = document.createElement('canvas');
    cv.id = 'group-chart-' + panel.dataset.sector + '-' + gi;
    wr.appendChild(cv);
    card.appendChild(wr);
    grid.appendChild(card);

    var alignedData = alignCommoditiesToAxis(members, unifiedLabels);

    requestAnimationFrame(function() {
      renderCombinedChart('group-chart-' + panel.dataset.sector + '-' + gi, g, members, unifiedLabels, alignedData);
    });
  });

  // Render individual commodity charts (skip grouped ones)
  commodities.forEach(function(c, i) {
    if (groupedNames[c.name]) return;
    var card = document.createElement('div');
    card.className = 'chart-card';
    var h3 = document.createElement('h3');
    var dotColor = c.color || '#4fc3f7';
    h3.innerHTML = '<span><span style="color:' + dotColor + ';">\u25cf</span> ' + c.name + '</span>' +
      '<span class="price-tag">' + fmtPrice(c.price) + ' <span style="color:#6c6c80;font-weight:400;font-size:11px;">' + c.unit + '</span>' + coverageNote(c) + '</span>';
    card.appendChild(h3);
    var wr = document.createElement('div');
    wr.className = 'chart-wrapper';
    var cv = document.createElement('canvas');
    cv.id = 'chart-' + panel.dataset.sector + '-' + i;
    wr.appendChild(cv);
    card.appendChild(wr);
    grid.appendChild(card);

    var aligned = alignCommoditiesToAxis([c], unifiedLabels);

    requestAnimationFrame(function() {
      renderSingleChart('chart-' + panel.dataset.sector + '-' + i, c, unifiedLabels, aligned[0]);
    });
  });
}

function fmtPrice(v) {
  if (v === null || v === undefined) return '\u2014';
  if (v >= 10000) return Number(v).toLocaleString('en-US', { minimumFractionDigits: 0 });
  if (v >= 100) return Number(v).toLocaleString('en-US', { minimumFractionDigits: 1 });
  return Number(v).toLocaleString('en-US', { minimumFractionDigits: 2 });
}
