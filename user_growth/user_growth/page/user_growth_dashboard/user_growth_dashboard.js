frappe.pages['user-growth-dashboard'].on_page_load = function(wrapper) {
    frappe.ui.make_app_page({
        parent: wrapper,
        title: '用户增长数据大屏',
        single_column: true
    });

    // ===== 注入样式 =====
    var style = document.createElement('style');
    style.textContent = `
        /* 全局 */
        .ugd-wrap { padding: 24px; background: #0a0e1a; min-height: calc(100vh - 60px); font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif; }
        
        /* 顶部标题 */
        .ugd-header { text-align: center; margin-bottom: 32px; }
        .ugd-header h1 { font-size: 1.6rem; font-weight: 700; margin: 0 0 4px 0; background: linear-gradient(135deg, #6c5ce7, #fd79a8); -webkit-background-clip: text; -webkit-text-fill-color: transparent; }
        .ugd-header p { color: #666688; font-size: 0.85rem; margin: 0; letter-spacing: 2px; }
        
        /* 指标卡片网格 */
        .ugd-grid { display: grid; grid-template-columns: repeat(4, 1fr); gap: 16px; margin-bottom: 24px; }
        @media (max-width: 900px) { .ugd-grid { grid-template-columns: repeat(2, 1fr); } }
        @media (max-width: 500px) { .ugd-grid { grid-template-columns: 1fr; } }
        
        /* 指标卡片 */
        .ugd-card {
            background: linear-gradient(135deg, rgba(255,255,255,0.04), rgba(255,255,255,0.01));
            border: 1px solid rgba(255,255,255,0.08);
            border-radius: 16px; padding: 24px; text-align: center;
            backdrop-filter: blur(12px); transition: all 0.3s;
            position: relative; overflow: hidden;
        }
        .ugd-card:hover { transform: translateY(-3px); border-color: rgba(108,92,231,0.3); box-shadow: 0 8px 32px rgba(108,92,231,0.12); }
        .ugd-card::before {
            content: ''; position: absolute; top: 0; left: 0; right: 0; height: 3px;
            background: linear-gradient(90deg, var(--card-accent), transparent);
        }
        .ugd-card .label { color: #8888aa; font-size: 0.8rem; font-weight: 500; margin-bottom: 8px; letter-spacing: 1px; text-transform: uppercase; }
        .ugd-card .value { font-size: 2.4rem; font-weight: 800; line-height: 1.1; margin-bottom: 4px; }
        .ugd-card .sub { color: #555577; font-size: 0.75rem; }
        .ugd-card .icon-circle {
            width: 44px; height: 44px; border-radius: 12px; display: flex; align-items: center; justify-content: center;
            margin: 0 auto 12px auto; font-size: 1.3rem;
        }
        
        /* 图表容器 */
        .ugd-chart-row { display: grid; grid-template-columns: 2fr 1fr; gap: 16px; margin-bottom: 16px; }
        .ugd-chart-row-2 { display: grid; grid-template-columns: 1fr 1fr; gap: 16px; margin-bottom: 16px; }
        @media (max-width: 900px) { .ugd-chart-row, .ugd-chart-row-2 { grid-template-columns: 1fr; } }
        
        .ugd-chart-box {
            background: rgba(255,255,255,0.03); border: 1px solid rgba(255,255,255,0.06);
            border-radius: 16px; padding: 20px; backdrop-filter: blur(8px);
        }
        .ugd-chart-box h3 {
            font-size: 0.9rem; font-weight: 600; color: #c8c8e0; margin: 0 0 16px 0;
            display: flex; align-items: center; gap: 8px;
        }
        .ugd-chart-box h3 i { font-size: 1rem; }
        .ugd-chart-box .chart-wrap { height: 300px; position: relative; }
        
        /* 加载动画 */
        .ugd-spinner { width: 36px; height: 36px; border: 3px solid rgba(108,92,231,0.1); border-top-color: #6c5ce7; border-radius: 50%; animation: spin 0.7s linear infinite; margin: 40px auto; }
        @keyframes spin { to { transform: rotate(360deg); } }

        /* 数字动画 */
        .count-up { display: inline-block; }
    `;
    document.head.appendChild(style);

    // ===== 渲染页面 =====
    $(wrapper).find('.page-content').html(`
        <div class="ugd-wrap">
            <div class="ugd-header">
                <h1><i class="fa fa-line-chart" style="-webkit-text-fill-color:initial;color:#6c5ce7;margin-right:8px;"></i>用户增长数据大屏</h1>
                <p>REAL-TIME USER GROWTH ANALYTICS DASHBOARD</p>
            </div>
            <div id="ugd-summary" class="ugd-grid"></div>
            <div class="ugd-chart-row">
                <div class="ugd-chart-box">
                    <h3><i class="fa fa-line-chart" style="color:#6c5ce7;"></i> 月度新增 vs 流失趋势</h3>
                    <div class="chart-wrap" id="chart-trend"></div>
                </div>
                <div class="ugd-chart-box">
                    <h3><i class="fa fa-pie-chart" style="color:#a29bfe;"></i> 服务类型分布</h3>
                    <div class="chart-wrap" id="chart-plan"></div>
                </div>
            </div>
            <div class="ugd-chart-row-2">
                <div class="ugd-chart-box">
                    <h3><i class="fa fa-bar-chart" style="color:#00b894;"></i> 渠道来源分布</h3>
                    <div class="chart-wrap" id="chart-channel"></div>
                </div>
                <div class="ugd-chart-box">
                    <h3><i class="fa fa-map-marker" style="color:#fd79a8;"></i> 城市分布 TOP15</h3>
                    <div class="chart-wrap" id="chart-city"></div>
                </div>
            </div>
            </div>
        </div>
    `);

    // ===== 加载数据 =====
    loadAllData();
};

function loadAllData() {
    var calls = [
        { method: "get_summary", callback: renderSummary },
        { method: "get_monthly_trend", callback: renderTrend },
        { method: "get_plan_distribution", callback: renderPlan },
        { method: "get_channel_distribution", callback: renderChannel },
        { method: "get_city_distribution", callback: renderCity },
    ];
    calls.forEach(function(c) {
        frappe.call({
            method: "user_growth.user_growth.page.user_growth_dashboard.user_growth_dashboard." + c.method,
            callback: function(r) { c.callback(r.message); }
        });
    });
}

// ===== 指标卡片 =====
function renderSummary(d) {
    if (!d) return;
    var icons = ["\u2295", "\u2714", "\u25b2", "\u25bc"];
    var cards = [
        { label: "\u603b\u7528\u6237\u6570", value: d.total_users, color: "#6c5ce7", bg: "rgba(108,92,231,0.15)", sub: "\u7d2f\u8ba1\u6ce8\u518c" },
        { label: "\u6d3b\u8dc3\u7528\u6237", value: d.active_users, color: "#00b894", bg: "rgba(0,184,148,0.15)", sub: "\u5f53\u524d\u6709\u6548" },
        { label: "\u672c\u6708\u65b0\u589e", value: d.new_this_month, color: "#74b9ff", bg: "rgba(116,185,255,0.15)", sub: "\u672c\u6708\u5f00\u901a" },
        { label: "\u672c\u6708\u6d41\u5931", value: d.churned_this_month, color: "#ff6b6b", bg: "rgba(255,107,107,0.15)", sub: "\u6d41\u5931\u7387 " + d.churn_rate + "%" },
    ];
    var html = '';
    cards.forEach(function(c, i) {
        html += '<div class="ugd-card" style="--card-accent:' + c.color + '">' +
            '<div class="icon-circle" style="background:' + c.bg + ';color:' + c.color + ';font-weight:700;font-size:1.4rem;">' + icons[i] + '</div>' +
            '<div class="label">' + c.label + '</div>' +
            '<div class="value" style="color:' + c.color + ';">' + c.value + '</div>' +
            '<div class="sub">' + c.sub + '</div></div>';
    });
    document.getElementById('ugd-summary').innerHTML = html;
}

// ===== 趋势图 =====
function renderTrend(data) {
    if (!data || !data.length) { document.getElementById('chart-trend').innerHTML = '<div style="text-align:center;padding:60px 0;color:#555577;">暂无数据</div>'; return; }
    var labels = data.map(function(d) { return d.month; });
    var newV = data.map(function(d) { return d.new_users; });
    var churnV = data.map(function(d) { return d.churned_users; });
    new frappe.Chart("#chart-trend", {
        data: { labels: labels, datasets: [
            { name: "新增用户", values: newV, chartType: "bar" },
            { name: "流失用户", values: churnV, chartType: "line" }
        ]},
        type: "axis-mixed", height: 280,
        colors: ["#6c5ce7", "#ff6b6b"],
        axisOptions: { xAxisMode: "tick", xIsSeries: 1 },
        barOptions: { stacked: false, spaceRatio: 0.4 }
    });
}

// ===== 饼图 =====
function renderPlan(data) {
    var c = document.getElementById('chart-plan');
    if (!data || !data.length) { c.innerHTML = '<div style="text-align:center;padding:60px 0;color:#555577;">暂无数据</div>'; return; }
    var validData = data.filter(function(d) { return d.plan_type && d.plan_type.trim(); });
    if (!validData.length) { c.innerHTML = '<div style="text-align:center;padding:60px 0;color:#555577;">暂无数据</div>'; return; }
    
    var total = validData.reduce(function(s, d) { return s + d.count; }, 0);
    if (total === 0) { c.innerHTML = '<div style="text-align:center;padding:60px 0;color:#555577;">暂无数据</div>'; return; }
    
    var html = '';
    var pieColors = ["#6c5ce7", "#0984e3", "#e84393", "#d63031"];
    
    validData.forEach(function(d, i) {
        var pct = (d.count / total * 100).toFixed(1);
        var color = pieColors[i % pieColors.length];
        html += '<div style="margin-bottom:16px;">' +
            '<div style="display:flex;justify-content:space-between;margin-bottom:4px;">' +
            '<span style="color:#e8e8f0;font-size:0.85rem;font-weight:500;">' + 
            '<span style="display:inline-block;width:12px;height:12px;border-radius:3px;background:' + color + ';margin-right:6px;vertical-align:middle;"></span>' +
            d.plan_type + '</span>' +
            '<span style="color:#8888aa;font-size:0.85rem;">' + d.count + ' (' + pct + '%)</span>' +
            '</div>' +
            '<div style="height:8px;background:rgba(255,255,255,0.06);border-radius:4px;overflow:hidden;">' +
            '<div style="height:100%;width:' + pct + '%;background:' + color + ';border-radius:4px;transition:width 0.5s;"></div>' +
            '</div></div>';
    });
    
    c.innerHTML = '<div style="padding:10px 5px;">' + html + '</div>';
}

// ===== 月度数据表格 =====
function renderTable(data) {
    var c = document.getElementById('chart-table');
    if (!data || !data.length) { c.innerHTML = '<div style="text-align:center;padding:40px;color:#555577;">暂无数据</div>'; return; }
    
    var html = '<table style="width:100%;border-collapse:collapse;font-size:0.82rem;">';
    html += '<thead><tr style="background:rgba(108,92,231,0.15);border-bottom:2px solid rgba(108,92,231,0.3);">';
    html += '<th style="padding:10px 8px;text-align:left;font-weight:600;color:#a29bfe;">月份</th>';
    html += '<th style="padding:10px 8px;text-align:center;font-weight:600;color:#a29bfe;">新增用户</th>';
    html += '<th style="padding:10px 8px;text-align:center;font-weight:600;color:#a29bfe;">流失用户</th>';
    html += '<th style="padding:10px 8px;text-align:center;font-weight:600;color:#a29bfe;">净增长</th>';
    html += '<th style="padding:10px 8px;text-align:center;font-weight:600;color:#a29bfe;">流失率</th>';
    html += '<th style="padding:10px 8px;text-align:center;font-weight:600;color:#a29bfe;">累计用户</th>';
    html += '</tr></thead><tbody>';
    
    data.forEach(function(d, i) {
        var bg = (i % 2 === 0) ? 'rgba(255,255,255,0.02)' : 'transparent';
        var netColor = d.net >= 0 ? '#00b894' : '#ff6b6b';
        html += '<tr style="background:' + bg + ';border-bottom:1px solid rgba(255,255,255,0.04);">';
        html += '<td style="padding:8px;text-align:left;font-weight:500;">' + d.month + '</td>';
        html += '<td style="padding:8px;text-align:center;">' + d.new + '</td>';
        html += '<td style="padding:8px;text-align:center;">' + d.churn + '</td>';
        html += '<td style="padding:8px;text-align:center;font-weight:600;color:' + netColor + ';">' + d.net + '</td>';
        html += '<td style="padding:8px;text-align:center;">' + d.rate + '</td>';
        html += '<td style="padding:8px;text-align:center;font-weight:600;">' + d.total + '</td>';
        html += '</tr>';
    });
    
    html += '</tbody></table>';
    c.innerHTML = html;
}

// ===== 渠道 =====
function renderChannel(data) {
    if (!data || !data.length) { document.getElementById('chart-channel').innerHTML = '<div style="text-align:center;padding:60px 0;color:#555577;">暂无数据</div>'; return; }
    new frappe.Chart("#chart-channel", {
        data: { labels: data.map(function(d) { return d.channel; }), datasets: [{ values: data.map(function(d) { return d.count; }) }] },
        type: "bar", height: 260, colors: ["#00b894"],
        barOptions: { spaceRatio: 0.4 }
    });
}

// ===== 城市 =====
function renderCity(data) {
    if (!data || !data.length) { document.getElementById('chart-city').innerHTML = '<div style="text-align:center;padding:60px 0;color:#555577;">暂无数据</div>'; return; }
    var labels = data.map(function(d) { return d.city; });
    var values = data.map(function(d) { return d.count; });
    new frappe.Chart("#chart-city", {
        data: { labels: labels, datasets: [{ values: values }] },
        type: "bar", height: 260, colors: ["#fd79a8"],
        barOptions: { spaceRatio: 0.4 }
    });
}
