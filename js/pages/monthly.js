// monthly.js — month navigation and personal income auto-calculation

// Track which month is being viewed. Start at current month.
let viewedYear = new Date().getFullYear();
let viewedMonth = new Date().getMonth(); // 0 = January, 11 = December

const MONTH_NAMES = [
  'January', 'February', 'March', 'April', 'May', 'June',
  'July', 'August', 'September', 'October', 'November', 'December'
];

function updateMonthLabel() {
  document.getElementById('current-month-label').textContent =
    MONTH_NAMES[viewedMonth] + ' ' + viewedYear;
}

document.getElementById('btn-prev-month').addEventListener('click', function () {
  viewedMonth -= 1;
  if (viewedMonth < 0) { viewedMonth = 11; viewedYear -= 1; }
  updateMonthLabel();
});

document.getElementById('btn-next-month').addEventListener('click', function () {
  viewedMonth += 1;
  if (viewedMonth > 11) { viewedMonth = 0; viewedYear += 1; }
  updateMonthLabel();
});

// Auto-calculate personal income as: total income - (ROI + buffer + forward)
function recalculatePersonalIncome() {
  const totalIncome = parseFloat(document.getElementById('monthly-income').dataset.raw) || 0;
  const roi = parseFloat(document.getElementById('alloc-roi').value) || 0;
  const buffer = parseFloat(document.getElementById('alloc-buffer').value) || 0;
  const forward = parseFloat(document.getElementById('alloc-forward').value) || 0;

  const allocated = roi + buffer + forward;
  const personal = totalIncome - allocated;

  document.getElementById('monthly-allocated').textContent = '₹' + allocated.toLocaleString('en-IN');
  document.getElementById('monthly-unallocated').textContent = '₹' + Math.max(0, personal).toLocaleString('en-IN');
  document.getElementById('alloc-personal').textContent = '₹' + personal.toLocaleString('en-IN');
  document.getElementById('alloc-personal').style.color = personal < 0 ? '#c0392b' : '#155724';
}

['alloc-roi', 'alloc-buffer', 'alloc-forward'].forEach(function (id) {
  document.getElementById(id).addEventListener('input', recalculatePersonalIncome);
});

updateMonthLabel();
