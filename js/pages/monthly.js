// monthly.js — month navigation, income calculation, allocation form

var viewedYear  = new Date().getFullYear();
var viewedMonth = new Date().getMonth(); // 0 = January, 11 = December

var MONTH_NAMES = [
  'January','February','March','April','May','June',
  'July','August','September','October','November','December'
];

function getMonthKey() {
  return viewedYear + '-' + String(viewedMonth + 1).padStart(2, '0');
}

function updateMonthLabel() {
  document.getElementById('current-month-label').textContent =
    MONTH_NAMES[viewedMonth] + ' ' + viewedYear;
}

function renderMonthly() {
  var monthKey = getMonthKey();
  var prefix   = monthKey + '-'; // e.g. "2026-09-"

  Promise.all([
    AppDB.getOrders(),
    AppDB.getAllocation(monthKey)
  ]).then(function (results) {
    var orders     = results[0];
    var allocation = results[1];

    // Sum paid orders whose date starts with this month
    var totalIncome = orders
      .filter(function (o) { return o.status === 'Paid' && o.date.startsWith(prefix); })
      .reduce(function (sum, o) { return sum + o.amount; }, 0);

    // Store raw value on the element so recalculate can read it
    var incomeEl = document.getElementById('monthly-income');
    incomeEl.textContent  = '$' + totalIncome.toLocaleString('en-US');
    incomeEl.dataset.raw  = totalIncome;

    // Populate allocation fields from saved data (or clear them)
    document.getElementById('alloc-roi').value     = allocation ? allocation.roi     : '';
    document.getElementById('alloc-buffer').value  = allocation ? allocation.buffer  : '';
    document.getElementById('alloc-forward').value = allocation ? allocation.forward : '';

    recalculatePersonalIncome();
  });
}

function recalculatePersonalIncome() {
  var totalIncome = parseFloat(document.getElementById('monthly-income').dataset.raw) || 0;
  var roi         = parseFloat(document.getElementById('alloc-roi').value)    || 0;
  var buffer      = parseFloat(document.getElementById('alloc-buffer').value) || 0;
  var forward     = parseFloat(document.getElementById('alloc-forward').value)|| 0;

  var allocated = roi + buffer + forward;
  var personal  = totalIncome - allocated;

  document.getElementById('monthly-allocated').textContent   = '$' + allocated.toLocaleString('en-US');
  document.getElementById('monthly-unallocated').textContent = '$' + Math.max(0, personal).toLocaleString('en-US');

  var personalEl = document.getElementById('alloc-personal');
  personalEl.textContent  = '$' + personal.toLocaleString('en-US');
  personalEl.style.color  = personal < 0 ? '#c0392b' : '#155724';

  var minSalary = parseFloat(localStorage.getItem('minSalary')) || 0;
  var warning   = document.getElementById('salary-warning');
  if (minSalary > 0 && personal < minSalary) {
    document.getElementById('salary-warning-amount').textContent = minSalary.toLocaleString('en-US');
    warning.style.display = 'block';
  } else {
    warning.style.display = 'none';
  }
}

document.getElementById('btn-prev-month').addEventListener('click', function () {
  viewedMonth -= 1;
  if (viewedMonth < 0) { viewedMonth = 11; viewedYear -= 1; }
  updateMonthLabel();
  renderMonthly();
});

document.getElementById('btn-next-month').addEventListener('click', function () {
  viewedMonth += 1;
  if (viewedMonth > 11) { viewedMonth = 0; viewedYear += 1; }
  updateMonthLabel();
  renderMonthly();
});

['alloc-roi', 'alloc-buffer', 'alloc-forward'].forEach(function (id) {
  document.getElementById(id).addEventListener('input', recalculatePersonalIncome);
});

document.getElementById('btn-save-allocation').addEventListener('click', function () {
  var allocation = {
    monthKey: getMonthKey(),
    roi:      parseFloat(document.getElementById('alloc-roi').value)     || 0,
    buffer:   parseFloat(document.getElementById('alloc-buffer').value)  || 0,
    forward:  parseFloat(document.getElementById('alloc-forward').value) || 0
  };

  AppDB.saveAllocation(allocation).then(function () {
    var btn = document.getElementById('btn-save-allocation');
    btn.textContent = 'Saved!';
    setTimeout(function () { btn.textContent = 'Save Allocation'; }, 2000);
  });
});

updateMonthLabel();
