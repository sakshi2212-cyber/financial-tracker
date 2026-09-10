// dashboard.js — summary stat cards and month-by-month breakdown table

var MONTH_ABBR = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];

function formatMonthKey(monthKey) {
  var parts = monthKey.split('-');
  return MONTH_ABBR[parseInt(parts[1]) - 1] + ' ' + parts[0];
}

function fmt(n) {
  return '$' + n.toLocaleString('en-US');
}

function renderDashboard() {
  AppDB.getAllData().then(function (data) {
    var orders      = data.orders;
    var investments = data.investments;
    var allocations = data.monthlyAllocations;

    // ── Summary cards (all-time totals) ────────────────────────────────────

    var totalInvested = investments.reduce(function (s, i) { return s + i.amount; }, 0);

    var totalIncome = orders
      .filter(function (o) { return o.status === 'Paid'; })
      .reduce(function (s, o) { return s + o.amount; }, 0);

    var totalRecovered = allocations.reduce(function (s, a) { return s + (a.roi    || 0); }, 0);
    var totalBuffer    = allocations.reduce(function (s, a) { return s + (a.buffer || 0); }, 0);
    var totalForward   = allocations.reduce(function (s, a) { return s + (a.forward|| 0); }, 0);

    document.getElementById('stat-total-invested').textContent     = fmt(totalInvested);
    document.getElementById('stat-total-income').textContent       = fmt(totalIncome);
    document.getElementById('stat-recovered').textContent          = fmt(totalRecovered);
    document.getElementById('stat-cash-buffer').textContent        = fmt(totalBuffer);
    document.getElementById('stat-forward-investment').textContent = fmt(totalForward);

    // ── Monthly breakdown table ─────────────────────────────────────────────

    // Build a map of monthKey → allocation for fast lookup
    var allocMap = {};
    allocations.forEach(function (a) { allocMap[a.monthKey] = a; });

    // Collect every unique month that appears in orders or allocations
    var monthSet = {};
    orders.forEach(function (o) {
      if (o.date) { monthSet[o.date.substring(0, 7)] = true; }
    });
    allocations.forEach(function (a) { monthSet[a.monthKey] = true; });

    var months = Object.keys(monthSet).sort().reverse(); // newest first

    var tbody = document.getElementById('monthly-breakdown-tbody');
    tbody.innerHTML = '';

    if (months.length === 0) {
      tbody.innerHTML = '<tr class="empty-row"><td colspan="6">No data yet. Add orders and monthly allocations to see the breakdown.</td></tr>';
      return;
    }

    months.forEach(function (monthKey) {
      var monthIncome = orders
        .filter(function (o) { return o.status === 'Paid' && o.date.startsWith(monthKey + '-'); })
        .reduce(function (s, o) { return s + o.amount; }, 0);

      var alloc    = allocMap[monthKey] || { roi: 0, buffer: 0, forward: 0 };
      var roi      = alloc.roi     || 0;
      var buffer   = alloc.buffer  || 0;
      var forward  = alloc.forward || 0;
      var personal = monthIncome - (roi + buffer + forward);

      var tr = document.createElement('tr');
      tr.innerHTML =
        '<td><strong>' + formatMonthKey(monthKey) + '</strong></td>' +
        '<td>' + fmt(monthIncome) + '</td>' +
        '<td>' + fmt(roi)         + '</td>' +
        '<td>' + fmt(buffer)      + '</td>' +
        '<td>' + fmt(forward)     + '</td>' +
        '<td class="' + (personal < 0 ? 'text-danger' : '') + '">' + fmt(personal) + '</td>';
      tbody.appendChild(tr);
    });
  });
}
