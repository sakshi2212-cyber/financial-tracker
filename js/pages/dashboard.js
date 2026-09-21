// dashboard.js — summary cards, monthly breakdown table, bar chart

var MONTH_ABBR = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];

function formatMonthKey(k) {
  var p = k.split('-');
  return MONTH_ABBR[parseInt(p[1]) - 1] + ' ' + p[0];
}

function fmt(n) { return '$' + (n || 0).toLocaleString('en-US'); }

var monthlyChart = null;

function renderChart(months, incomeData, costData) {
  var ctx = document.getElementById('monthly-chart').getContext('2d');
  if (monthlyChart) {
    monthlyChart.data.labels           = months;
    monthlyChart.data.datasets[0].data = incomeData;
    monthlyChart.data.datasets[1].data = costData;
    monthlyChart.update();
    return;
  }
  monthlyChart = new Chart(ctx, {
    type: 'bar',
    data: {
      labels: months,
      datasets: [
        { label: 'Income',         data: incomeData, backgroundColor: '#7b2fbe', borderRadius: 4 },
        { label: 'Material Costs', data: costData,   backgroundColor: '#d4830a', borderRadius: 4 }
      ]
    },
    options: {
      responsive: true,
      plugins: { legend: { position: 'top' } },
      scales: {
        y: { beginAtZero: true, ticks: { callback: function (v) { return '$' + v; } } }
      }
    }
  });
}

function renderDashboard() {
  AppDB.getAllData().then(function (data) {
    var orders      = data.orders;
    var investments = data.investments;
    var allocations = data.monthlyAllocations;
    var myPay       = parseFloat(localStorage.getItem('minSalary')) || 0;

    // ── Summary cards ─────────────────────────────────────────────────────

    var totalInvested = investments.reduce(function (s, i) { return s + i.amount; }, 0);
    var totalIncome   = orders.filter(function (o) { return isPaid(o.status); })
                              .reduce(function (s, o) { return s + o.amount; }, 0);
    var totalReturned = allocations.reduce(function (s, a) { return s + (a.recover || 0); }, 0);

    document.getElementById('stat-total-invested').textContent = fmt(totalInvested);
    document.getElementById('stat-total-income').textContent   = fmt(totalIncome);
    document.getElementById('stat-recovered').textContent      = fmt(totalReturned);
    document.getElementById('stat-recovered-note').textContent = 'of ' + fmt(totalInvested) + ' invested';

    // ── Build month list ──────────────────────────────────────────────────

    var allocMap = {};
    allocations.forEach(function (a) { allocMap[a.monthKey] = a; });

    var monthSet = {};
    orders.forEach(function (o) { if (o.date) { monthSet[o.date.substring(0, 7)] = true; } });
    investments.forEach(function (i) { if (i.date) { monthSet[i.date.substring(0, 7)] = true; } });
    allocations.forEach(function (a) { monthSet[a.monthKey] = true; });

    var months = Object.keys(monthSet).sort().reverse();

    // ── Total savings (sum over all months) ───────────────────────────────

    var totalSavings = months.reduce(function (sum, monthKey) {
      var prefix     = monthKey + '-';
      var mIncome    = orders.filter(function (o) { return isPaid(o.status) && o.date.startsWith(prefix); })
                             .reduce(function (s, o) { return s + o.amount; }, 0);
      var mMatCosts  = investments.filter(function (i) { return i.category === 'Materials' && i.date && i.date.startsWith(prefix); })
                                  .reduce(function (s, i) { return s + i.amount; }, 0);
      var mRecover   = (allocMap[monthKey] || {}).recover || 0;
      return sum + (mIncome - mMatCosts - mRecover - myPay);
    }, 0);

    document.getElementById('stat-savings').textContent = fmt(Math.max(0, totalSavings));

    // ── Monthly breakdown table ───────────────────────────────────────────

    var tbody = document.getElementById('monthly-breakdown-tbody');
    tbody.innerHTML = '';

    if (months.length === 0) {
      tbody.innerHTML = '<tr class="empty-row"><td colspan="7">No data yet.</td></tr>';
      renderChart([], [], []);
      return;
    }

    var chartMonths = months.slice().reverse();
    var chartIncome = [];
    var chartCosts  = [];

    months.forEach(function (monthKey) {
      var prefix    = monthKey + '-';
      var mIncome   = orders.filter(function (o) { return isPaid(o.status) && o.date.startsWith(prefix); })
                            .reduce(function (s, o) { return s + o.amount; }, 0);
      var mMatCosts = investments.filter(function (i) { return i.category === 'Materials' && i.date && i.date.startsWith(prefix); })
                                 .reduce(function (s, i) { return s + i.amount; }, 0);
      var mGross    = mIncome - mMatCosts;
      var mRecover  = (allocMap[monthKey] || {}).recover || 0;
      var mSavings  = mGross - mRecover - myPay;

      var tr = document.createElement('tr');
      tr.innerHTML =
        '<td><strong>' + formatMonthKey(monthKey) + '</strong></td>' +
        '<td>' + fmt(mIncome)   + '</td>' +
        '<td>' + fmt(mMatCosts) + '</td>' +
        '<td class="' + (mGross   < 0 ? 'text-danger' : '') + '">' + fmt(mGross)   + '</td>' +
        '<td>' + fmt(mRecover)  + '</td>' +
        '<td>' + fmt(myPay)     + '</td>' +
        '<td class="' + (mSavings < 0 ? 'text-danger' : 'text-success') + '">' + fmt(mSavings) + '</td>';
      tbody.appendChild(tr);
    });

    chartMonths.forEach(function (monthKey) {
      var prefix = monthKey + '-';
      chartIncome.push(orders.filter(function (o) { return isPaid(o.status) && o.date.startsWith(prefix); })
                             .reduce(function (s, o) { return s + o.amount; }, 0));
      chartCosts.push(investments.filter(function (i) { return i.category === 'Materials' && i.date && i.date.startsWith(prefix); })
                                 .reduce(function (s, i) { return s + i.amount; }, 0));
    });

    renderChart(chartMonths.map(formatMonthKey), chartIncome, chartCosts);
  });
}
