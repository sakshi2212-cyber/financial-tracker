// monthly.js — monthly summary: income, material costs, recovery, my pay, savings

var viewedYear  = new Date().getFullYear();
var viewedMonth = new Date().getMonth();

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

function fmt(n) { return '$' + (n || 0).toLocaleString('en-US'); }

// ── Render ─────────────────────────────────────────────────────────────────

function renderMonthly() {
  var monthKey = getMonthKey();
  var myPay    = parseFloat(localStorage.getItem('minSalary')) || 0;

  document.getElementById('s-mypay').textContent = fmt(myPay);

  // Fetch everything in one go so all calculations are consistent
  Promise.all([
    AppDB.getOrders(),
    AppDB.getMaterialCosts(),
    AppDB.getAllAllocations()
  ]).then(function (results) {
    var allOrders      = results[0];
    var allMatCosts    = results[1];
    var allAllocations = results[2];

    var allocMap = {};
    allAllocations.forEach(function (a) { allocMap[a.monthKey] = a; });

    // ── This month ───────────────────────────────────────────────────────

    var prefix     = monthKey + '-';
    var paidOrders = allOrders.filter(function (o) {
      return isPaid(o.status) && o.date.startsWith(prefix);
    });
    var income = paidOrders.reduce(function (s, o) { return s + o.amount; }, 0);

    document.getElementById('s-income').textContent      = fmt(income);
    document.getElementById('s-income-note').textContent =
      'from ' + paidOrders.length + ' paid order' + (paidOrders.length !== 1 ? 's' : '');

    var monthMaterials = allMatCosts.filter(function (mc) { return mc.monthKey === monthKey; });
    renderMaterials(monthMaterials);
    var matTotal = monthMaterials.reduce(function (s, mc) { return s + mc.amount; }, 0);
    document.getElementById('s-mat-total').textContent = fmt(matTotal);

    var gross   = income - matTotal;
    document.getElementById('s-gross').textContent = fmt(gross);

    var recover = (allocMap[monthKey] || {}).recover || 0;
    document.getElementById('s-recover').textContent         = recover > 0 ? fmt(recover) : '—';
    document.getElementById('btn-add-recover').textContent   = recover > 0 ? 'Edit' : '+ Add';
    if (recover > 0) { document.getElementById('recover-amount').value = recover; }

    var savings = gross - recover - myPay;
    var savingsEl = document.getElementById('s-savings');
    savingsEl.textContent = fmt(savings);
    savingsEl.style.color = savings < 0 ? '#DC2626' : '#059669';

    // ── Previous balance & total (cumulative) ────────────────────────────

    function calcSavingsForMonth(mk) {
      var pfx  = mk + '-';
      var mInc = allOrders.filter(function (o) { return isPaid(o.status) && o.date.startsWith(pfx); })
                          .reduce(function (s, o) { return s + o.amount; }, 0);
      var mMat = allMatCosts.filter(function (mc) { return mc.monthKey === mk; })
                            .reduce(function (s, mc) { return s + mc.amount; }, 0);
      var mRec = (allocMap[mk] || {}).recover || 0;
      return mInc - mMat - mRec - myPay;
    }

    var monthSet = {};
    allOrders.forEach(function (o)      { if (o.date) { monthSet[o.date.substring(0, 7)] = true; } });
    allMatCosts.forEach(function (mc)   { monthSet[mc.monthKey] = true; });
    allAllocations.forEach(function (a) { monthSet[a.monthKey] = true; });

    var prevBalance = Object.keys(monthSet)
      .filter(function (mk) { return mk < monthKey; })
      .reduce(function (sum, mk) { return sum + calcSavingsForMonth(mk); }, 0);

    var totalBalance = prevBalance + savings;

    var prevEl = document.getElementById('s-prev-balance');
    prevEl.textContent = fmt(prevBalance);
    prevEl.style.color = prevBalance < 0 ? '#DC2626' : '#059669';

    var totalEl = document.getElementById('s-savings-balance');
    totalEl.textContent = fmt(totalBalance);
    totalEl.style.color = totalBalance < 0 ? '#DC2626' : '#059669';

    // Warning only when total savings goes negative (previous balance + this month)
    document.getElementById('s-warning').style.display = totalBalance < 0 ? 'block' : 'none';
  });
}

// ── Materials list ──────────────────────────────────────────────────────────

function renderMaterials(materials) {
  var list = document.getElementById('s-materials-list');
  list.innerHTML = '';
  materials.forEach(function (mc) {
    var row = document.createElement('div');
    row.className = 'sublist-row';
    row.innerHTML =
      '<span class="sublist-desc">' + (mc.description || 'Material') + '</span>' +
      '<span class="sublist-right">' +
        '<span class="sublist-amount">' + fmt(mc.amount) + '</span>' +
        '<button class="btn-sublist-edit">Edit</button>' +
        '<button class="btn-sublist-delete">✕</button>' +
      '</span>';
    row.querySelector('.btn-sublist-edit').addEventListener('click', function () {
      openMaterialEdit(row, mc);
    });
    row.querySelector('.btn-sublist-delete').addEventListener('click', function () {
      AppDB.deleteMaterialCost(mc.id).then(renderMonthly);
    });
    list.appendChild(row);
  });
}

function openMaterialEdit(row, mc) {
  row.innerHTML =
    '<input class="inline-edit-text" type="text" value="' + (mc.description || '') + '" />' +
    '<span class="sublist-right">' +
      '<input class="inline-edit-num" type="number" value="' + mc.amount + '" min="0" />' +
      '<button class="btn-sublist-save">Save</button>' +
      '<button class="btn-sublist-cancel">Cancel</button>' +
    '</span>';
  row.querySelector('.btn-sublist-save').addEventListener('click', function () {
    mc.description = row.querySelector('.inline-edit-text').value.trim();
    mc.amount      = parseFloat(row.querySelector('.inline-edit-num').value) || 0;
    AppDB.updateMaterialCost(mc).then(renderMonthly);
  });
  row.querySelector('.btn-sublist-cancel').addEventListener('click', renderMonthly);
}

// ── Add material cost ───────────────────────────────────────────────────────

document.getElementById('btn-add-material').addEventListener('click', function () {
  document.getElementById('form-add-material').style.display = 'flex';
  this.style.display = 'none';
  document.getElementById('mat-desc').focus();
});

document.getElementById('btn-cancel-material').addEventListener('click', function () {
  document.getElementById('form-add-material').style.display = 'none';
  document.getElementById('btn-add-material').style.display  = 'inline-block';
  document.getElementById('mat-desc').value   = '';
  document.getElementById('mat-amount').value = '';
});

document.getElementById('btn-save-material').addEventListener('click', function () {
  var amount = parseFloat(document.getElementById('mat-amount').value);
  if (isNaN(amount) || amount <= 0) { alert('Please enter a valid amount.'); return; }
  AppDB.addMaterialCost({
    monthKey:    getMonthKey(),
    description: document.getElementById('mat-desc').value.trim() || 'Material cost',
    amount:      amount
  }).then(function () {
    document.getElementById('mat-desc').value   = '';
    document.getElementById('mat-amount').value = '';
    document.getElementById('form-add-material').style.display = 'none';
    document.getElementById('btn-add-material').style.display  = 'inline-block';
    renderMonthly();
  });
});

// ── Add / edit recovery ─────────────────────────────────────────────────────

document.getElementById('btn-add-recover').addEventListener('click', function () {
  document.getElementById('form-add-recover').style.display = 'flex';
  document.getElementById('recover-amount').focus();
});

document.getElementById('btn-cancel-recover').addEventListener('click', function () {
  document.getElementById('form-add-recover').style.display = 'none';
});

document.getElementById('btn-save-recover').addEventListener('click', function () {
  var amount = parseFloat(document.getElementById('recover-amount').value) || 0;
  AppDB.saveAllocation({ monthKey: getMonthKey(), recover: amount }).then(function () {
    document.getElementById('form-add-recover').style.display = 'none';
    renderMonthly();
  });
});

// ── Month navigation ────────────────────────────────────────────────────────

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

updateMonthLabel();
