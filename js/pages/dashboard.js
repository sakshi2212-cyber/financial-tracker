// dashboard.js — summary cards, monthly breakdown table with margin, and bar chart

var MONTH_ABBR = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];

function formatMonthKey(monthKey) {
  var parts = monthKey.split('-');
  return MONTH_ABBR[parseInt(parts[1]) - 1] + ' ' + parts[0];
}

function fmt(n) {
  return '$' + (n || 0).toLocaleString('en-US');
}

// Keep a reference so we can update the chart instead of recreating it each time
var monthlyChart = null;

function renderChart(months, incomeData, costData) {
  var ctx = document.getElementById('monthly-chart').getContext('2d');

  if (monthlyChart) {
    monthlyChart.data.labels                  = months;
    monthlyChart.data.datasets[0].data        = incomeData;
    monthlyChart.data.datasets[1].data        = costData;
    monthlyChart.update();
    return;
  }

  monthlyChart = new Chart(ctx, {
    type: 'bar',
    data: {
      labels: months,
      datasets: [
        {
          label: 'Income',
          data: incomeData,
          backgroundColor: '#27ae60',
          borderRadius: 4
        },
        {
          label: 'Material Costs',
          data: costData,
          backgroundColor: '#e74c3c',
          borderRadius: 4
        }
      ]
    },
    options: {
      responsive: true,
      plugins: {
        legend: { position: 'top' }
      },
      scales: {
        y: {
          beginAtZero: true,
          ticks: {
            callback: function (value) { return '$' + value; }
          }
        }
      }
    }
  });
}

function renderDashboard() {
  AppDB.getAllData().then(function (data) {
    var orders      = data.orders;
    var investments = data.investments;
    var allocations = data.monthlyAllocations;

    // ── Summary cards ─────────────────────────────────────────────────────

    var totalInvested  = investments.reduce(function (s, i) { return s + i.amount; }, 0);
    var totalIncome    = orders.filter(function (o) { return o.status === 'Paid'; })
                               .reduce(function (s, o) { return s + o.amount; }, 0);
    var totalRecovered = allocations.reduce(function (s, a) { return s + (a.roi    || 0); }, 0);
    var totalBuffer    = allocations.reduce(function (s, a) { return s + (a.buffer || 0); }, 0);
    var totalForward   = allocations.reduce(function (s, a) { return s + (a.forward|| 0); }, 0);

    document.getElementById('stat-total-invested').textContent     = fmt(totalInvested);
    document.getElementById('stat-total-income').textContent       = fmt(totalIncome);
    document.getElementById('stat-recovered').textContent          = fmt(totalRecovered);
    document.getElementById('stat-cash-buffer').textContent        = fmt(totalBuffer);
    document.getElementById('stat-forward-investment').textContent = fmt(totalForward);

    // ── Build month list ──────────────────────────────────────────────────

    var allocMap = {};
    allocations.forEach(function (a) { allocMap[a.monthKey] = a; });

    var monthSet = {};
    orders.forEach(function (o) { if (o.date) { monthSet[o.date.substring(0, 7)] = true; } });
    allocations.forEach(function (a) { monthSet[a.monthKey] = true; });
    investments.forEach(function (i) { if (i.date) { monthSet[i.date.substring(0, 7)] = true; } });

    var months = Object.keys(monthSet).sort().reverse();

    // ── Monthly breakdown table ───────────────────────────────────────────

    var tbody = document.getElementById('monthly-breakdown-tbody');
    tbody.innerHTML = '';

    if (months.length === 0) {
      tbody.innerHTML = '<tr class="empty-row"><td colspan="8">No data yet. Add orders and monthly allocations to see the breakdown.</td></tr>';
      renderChart([], [], []);
      return;
    }

    // Build chart data in chronological order (oldest first looks better in a bar chart)
    var chartMonths   = months.slice().reverse();
    var chartIncome   = [];
    var chartCosts    = [];

    months.forEach(function (monthKey) {
      var monthIncome = orders
        .filter(function (o) { return o.status === 'Paid' && o.date.startsWith(monthKey + '-'); })
        .reduce(function (s, o) { return s + o.amount; }, 0);

      // Only "Materials" category counts as recurring production cost
      var matCosts = investments
        .filter(function (i) { return i.category === 'Materials' && i.date && i.date.startsWith(monthKey + '-'); })
        .reduce(function (s, i) { return s + i.amount; }, 0);

      var margin   = monthIncome - matCosts;
      var alloc    = allocMap[monthKey] || { roi: 0, buffer: 0, forward: 0 };
      var roi      = alloc.roi    || 0;
      var buffer   = alloc.buffer || 0;
      var forward  = alloc.forward|| 0;
      var personal = monthIncome - (roi + buffer + forward);

      var tr = document.createElement('tr');
      tr.innerHTML =
        '<td><strong>' + formatMonthKey(monthKey) + '</strong></td>' +
        '<td>' + fmt(monthIncome) + '</td>' +
        '<td>' + fmt(matCosts)    + '</td>' +
        '<td class="' + (margin   < 0 ? 'text-danger' : 'text-success') + '">' + fmt(margin)   + '</td>' +
        '<td>' + fmt(roi)         + '</td>' +
        '<td>' + fmt(buffer)      + '</td>' +
        '<td>' + fmt(forward)     + '</td>' +
        '<td class="' + (personal < 0 ? 'text-danger' : '') + '">' + fmt(personal) + '</td>';
      tbody.appendChild(tr);
    });

    // Populate chart arrays in chronological order
    chartMonths.forEach(function (monthKey) {
      chartIncome.push(
        orders.filter(function (o) { return o.status === 'Paid' && o.date.startsWith(monthKey + '-'); })
              .reduce(function (s, o) { return s + o.amount; }, 0)
      );
      chartCosts.push(
        investments.filter(function (i) { return i.category === 'Materials' && i.date && i.date.startsWith(monthKey + '-'); })
                   .reduce(function (s, i) { return s + i.amount; }, 0)
      );
    });

    renderChart(chartMonths.map(formatMonthKey), chartIncome, chartCosts);
  });
}
