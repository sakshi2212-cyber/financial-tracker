// dashboard.js — calculates and displays live summary stats

function renderDashboard() {
  AppDB.getAllData().then(function (data) {
    var totalInvested = data.investments.reduce(function (sum, i) {
      return sum + i.amount;
    }, 0);

    var totalIncome = data.orders
      .filter(function (o) { return o.status === 'Paid'; })
      .reduce(function (sum, o) { return sum + o.amount; }, 0);

    var totalRecovered = data.monthlyAllocations.reduce(function (sum, a) {
      return sum + (a.roi || 0);
    }, 0);

    var totalBuffer = data.monthlyAllocations.reduce(function (sum, a) {
      return sum + (a.buffer || 0);
    }, 0);

    var totalForward = data.monthlyAllocations.reduce(function (sum, a) {
      return sum + (a.forward || 0);
    }, 0);

    document.getElementById('stat-total-invested').textContent    = '$' + totalInvested.toLocaleString('en-US');
    document.getElementById('stat-total-income').textContent      = '$' + totalIncome.toLocaleString('en-US');
    document.getElementById('stat-recovered').textContent         = '$' + totalRecovered.toLocaleString('en-US');
    document.getElementById('stat-cash-buffer').textContent       = '$' + totalBuffer.toLocaleString('en-US');
    document.getElementById('stat-forward-investment').textContent = '$' + totalForward.toLocaleString('en-US');
  });
}
