// app.js — navigation and app initialisation

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

// Render dashboard on first load
renderDashboard();
