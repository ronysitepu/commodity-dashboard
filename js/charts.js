const CHART_DEFAULTS = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
        legend: { display: false },
        tooltip: {
            backgroundColor: '#1a1a2e', titleColor: '#e0e0e0', bodyColor: '#e0e0e0',
            borderColor: '#2a2a45', borderWidth: 1, padding: 10, cornerRadius: 6,
            callbacks: {
                title: function(items) { return items[0].label; },
                label: function(ctx) { return ctx.dataset.label + ': ' + ctx.parsed.y; }
            }
        }
    },
    scales: {
        x: { grid: { color: 'rgba(255,255,255,0.04)', drawBorder: false }, ticks: { color: '#6c6c80', font: { size: 10 }, maxRotation: 45 } },
        y: { display: false, grid: { display: false }, ticks: { display: false } }
    },
    elements: { point: { radius: 3, hoverRadius: 5 } },
    animation: { duration: 600 }
};
function renderCommodityChart(canvasId, commodity) {
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
                label: commodity.name,
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
                        label: function(t) { return commodity.name + ': ' + t.parsed.y + ' ' + commodity.unit; }
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
function renderSectorCharts(panel, commodities) {
    var grid = panel.querySelector('.chart-grid');
    grid.innerHTML = '';
    commodities.forEach(function(c, i) {
        var card = document.createElement('div');
        card.className = 'chart-card';
        var h3 = document.createElement('h3');
        h3.innerHTML = '<span style="color:' + c.color + ';">\u25cf</span> ' + c.name + ' <span class="price-tag">' + fmtPrice(c.price) + ' <span style="color:#6c6c80;font-weight:400;font-size:11px;">' + c.unit + '</span></span>';
        card.appendChild(h3);
        var wr = document.createElement('div');
        wr.className = 'chart-wrapper';
        var cv = document.createElement('canvas');
        cv.id = 'chart-' + panel.dataset.sector + '-' + i;
        wr.appendChild(cv);
        card.appendChild(wr);
        grid.appendChild(card);
    });
    requestAnimationFrame(function() {
        commodities.forEach(function(c, i) {
            renderCommodityChart('chart-' + panel.dataset.sector + '-' + i, c);
        });
    });
}
function fmtPrice(v) {
    if (v === null || v === undefined) return '\u2014';
    if (v >= 10000) return Number(v).toLocaleString('en-US', { minimumFractionDigits: 0 });
    if (v >= 100) return Number(v).toLocaleString('en-US', { minimumFractionDigits: 1 });
    return Number(v).toLocaleString('en-US', { minimumFractionDigits: 2 });
}