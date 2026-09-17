// app.js — navigation, shared constants, startup migration, app initialisation

// Statuses that count as income (payment has been received)
var PAID_STATUSES = ['Payment Complete', 'In Progress', 'Order Shipped'];

function isPaid(status) {
  return PAID_STATUSES.indexOf(status) !== -1;
}

// ── Startup migration ──────────────────────────────────────────────────────
// Migrates any orders in IndexedDB that still have old Paid/Pending statuses
// from before schema v2. Runs silently once on load; no-ops if already migrated.
function migrateExistingOrders() {
  AppDB.getOrders().then(function (orders) {
    var toUpdate = orders.filter(function (o) {
      return o.status === 'Paid' || o.status === 'Pending';
    });

    if (toUpdate.length === 0) { return; }

    var updates = toUpdate.map(function (o) {
      if (o.status === 'Paid')    { o.status = 'Order Shipped'; }
      if (o.status === 'Pending') { o.status = 'Order Received'; }
      return AppDB.updateOrder(o);
    });

    Promise.all(updates).then(function () {
      renderDashboard();
      renderOrders();
    });
  });
}

// ── Navigation ─────────────────────────────────────────────────────────────

function navigateTo(pageName) {
  document.querySelectorAll('.page').forEach(function (p) { p.classList.remove('active'); });
  document.querySelectorAll('.nav-links a').forEach(function (a) { a.classList.remove('active'); });

  document.getElementById('page-' + pageName).classList.add('active');
  document.querySelector('[data-page="' + pageName + '"]').classList.add('active');

  if (pageName === 'dashboard')   { renderDashboard(); }
  if (pageName === 'orders')      { renderOrders(); }
  if (pageName === 'investments') { renderInvestments(); }
  if (pageName === 'monthly')     { renderMonthly(); }
}

document.querySelectorAll('.nav-links a').forEach(function (link) {
  link.addEventListener('click', function (e) {
    e.preventDefault();
    navigateTo(this.dataset.page);
  });
});

// Render dashboard on first load, then check for data to migrate
renderDashboard();
migrateExistingOrders();
