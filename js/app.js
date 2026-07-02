(function() {
    'use strict';
    var data = null;
    var $ = function(s, c) { return (c || document).querySelector(s); };
    var $$ = function(s, c) { return Array.from((c || document).querySelectorAll(s)); };
    function fmtPrice(v) {
        if (v === null || v === undefined) return '\u2014';
        if (v >= 10000) return Number(v).toLocaleString('en-US', { minimumFractionDigits: 0 });
        if (v >= 100) return Number(v).toLocaleString('en-US', { minimumFractionDigits: 1 });
        return Number(v).toLocaleString('en-US', { minimumFractionDigits: 2 });
    }
    function fmtPct(v) {
        if (v === null || v === undefined) return '\u2014';
        return (v > 0 ? '+' : '') + v.toFixed(1) + '%';
    }
    async function init() {
        showLoading();
        try {
            var resp = await fetch('data/commodities.json?_t=' + Date.now());
            if (!resp.ok) throw new Error('HTTP ' + resp.status);
            data = await resp.json();
            if (!data || !data.sectors || data.sectors.length === 0) {
                showError('No data'); return;
            }
            buildTabs(data.sectors);
            buildPanels(data.sectors);
            activateTab(data.sectors[0].name);
            var info = document.getElementById('header-info');
            if (info) info.textContent = data.total_commodities + ' commodities \u00b7 Updated ' + data.updated_label;
        } catch(e) {
            showError('Failed: ' + e.message);
        }
    }
    function showLoading() {
        var c = $('#main-content');
        c.innerHTML = '<div class="loading"><div class="spinner"></div><div>Loading commodity data...</div></div>';
    }
    function showError(m) {
        $('#main-content').innerHTML = '<div class="error-state"><div style="font-size:32px">\u26a0\ufe0f</div><div>' + m + '</div><button class="retry-btn" onclick="location.reload()">Retry</button></div>';
    }
    function buildTabs(sectors) {
        var bar = document.getElementById('tab-bar');
        bar.innerHTML = '';
        sectors.forEach(function(s) {
            var btn = document.createElement('button');
            btn.className = 'tab-btn';
            btn.dataset.sector = s.name;
            btn.textContent = s.icon + ' ' + s.name;
            btn.addEventListener('click', function() { activateTab(s.name); });
            bar.appendChild(btn);
        });
    }
    function buildPanels(sectors) {
        var c = $('#main-content');
        c.innerHTML = '';
        sectors.forEach(function(s) {
            var p = document.createElement('div');
            p.className = 'tab-panel';
            p.dataset.sector = s.name;
            p.innerHTML = buildPanelHTML(s);
            c.appendChild(p);
        });
    }
    function buildPanelHTML(sector) {
        var cards = '';
        sector.commodities.forEach(function(c) {
            var cls = c.change_1d !== null ? (c.change_1d >= 0 ? 'pos' : 'neg') : 'flat';
            var chg = c.change_1d !== null ? fmtPct(c.change_1d) : '\u2014';
            cards += '<div class="summary-card"><div class="commodity-name">' + c.name + '</div><div class="commodity-price" style="color:' + c.color + '">' + fmtPrice(c.price) + '</div><div class="commodity-change ' + cls + '">' + chg + '</div><div class="commodity-unit">' + c.unit + '</div></div>';
        });
        var rows = '';
        sector.commodities.forEach(function(c) {
            var d1 = c.change_1d !== null ? fmtPct(c.change_1d) : '\u2014';
            var d7 = c.change_1w !== null ? fmtPct(c.change_1w) : '\u2014';
            var d1c = c.change_1d !== null ? (c.change_1d >= 0 ? 'pos' : 'neg') : 'flat';
            var d7c = c.change_1w !== null ? (c.change_1w >= 0 ? 'pos' : 'neg') : 'flat';
            rows += '<tr><td class="name"><span class="color-dot" style="background:' + c.color + '"></span>' + c.name + '</td><td class="price-cell">' + fmtPrice(c.price) + '</td><td class="unit-cell">' + c.unit + '</td><td class="chg ' + d1c + '">' + d1 + '</td><td class="chg ' + d7c + '">' + d7 + '</td><td class="trend-cell">' + c.trend + '</td><td class="dots-cell">' + c.data_points + '</td></tr>';
        });
        return '<div class="summary-row">' + cards + '</div><div class="chart-grid"></div><div class="table-section"><h3>\ud83d\udccb Price Overview</h3><table class="price-table"><thead><tr><th>Commodity</th><th>Price</th><th>Unit</th><th>1D \u0394</th><th>1W \u0394</th><th>Trend</th><th>Data Pts</th></tr></thead><tbody>' + rows + '</tbody></table></div>';
    }
    function activateTab(name) {
        $$('.tab-btn').forEach(function(b) { b.classList.toggle('active', b.dataset.sector === name); });
        $$('.tab-panel').forEach(function(p) {
            var a = p.dataset.sector === name;
            p.classList.toggle('active', a);
            if (a && !p.dataset.chartsRendered) {
                p.dataset.chartsRendered = 'true';
                var sector = data.sectors.find(function(s) { return s.name === name; });
                if (sector) renderSectorCharts(p, sector.commodities);
            }
        });
    }
    if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', init);
    else init();
})();