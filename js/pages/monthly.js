// monthly.js — redesigned monthly summary: income, material costs, recovery, my pay, savings

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
  var prefix   = monthKey + '-';
  var myPay    = parseFloat(localStorage.getItem('minSalary')) || 0;

  document.getElementById('s-mypay').textContent = fmt(myPay);

  Promise.all([
    AppDB.getOrders(),
    AppDB.getInvestments(),
    AppDB.getAllocation(monthKey)
  ]).then(function (results) {
    var orders      = results[0];
    var investments = results[1];
    var allocation  = results[2];

    // Income — Payment Complete, In Progress, Order Shipped
    var paidOrders = orders.filter(function (o) {
      return isPaid(o.status) && o.date.startsWith(prefix);
    });
    var income = paidOrders.reduce(function (s, o) { return s + o.amount; }, 0);
    document.getElementById('s-income').textContent      = fmt(income);
    document.getElementById('s-income-note').textContent =
      'from ' + paidOrders.length + ' paid order' + (paidOrders.length !== 1 ? 's' : '');

    // Material costs for this month
    var materials = investments.filter(function (i) {
      return i.category === 'Materials' && i.date && i.date.startsWith(prefix);
    });
    renderMaterials(materials);

    var matTotal = materials.reduce(function (s, i) { return s + i.amount; }, 0);
    document.getElementById('s-mat-total').textContent = fmt(matTotal);

    // Gross profit
    var gross = income - matTotal;
    document.getElementById('s-gross').textContent = fmt(gross);

    // Recovery
    var recover = allocation ? (allocation.recover || 0) : 0;
    document.getElementById('s-recover').textContent = recover > 0 ? fmt(recover) : '—';
    document.getElementById('btn-add-recover').textContent = recover > 0 ? 'Edit' : '+ Add';
    if (recover > 0) {
      document.getElementById('recover-amount').value = recover;
    }

    // Savings
    var savings = gross - recover - myPay;
    var savingsEl = document.getElementById('s-savings');
    savingsEl.textContent  = fmt(savings);
    savingsEl.style.color  = savings < 0 ? '#DC2626' : '#059669';

    // Warning
    var warning = document.getElementById('s-warning');
    warning.style.display = (savings < 0) ? 'block' : 'none';
  });
}

// ── Materials list ──────────────────────────────────────────────────────────

function renderMaterials(materials) {
  var list = document.getElementById('s-materials-list');
  list.innerHTML = '';

  materials.forEach(function (inv) {
    var row = document.createElement('div');
    row.className = 'sublist-row';
    row.dataset.id = inv.id;

    row.innerHTML =
      '<span class="sublist-desc">' + (inv.description || 'Material') + '</span>' +
      '<span class="sublist-right">' +
        '<span class="sublist-amount">' + fmt(inv.amount) + '</span>' +
        '<button class="btn-sublist-edit">Edit</button>' +
        '<button class="btn-sublist-delete">✕</button>' +
      '</span>';

    row.querySelector('.btn-sublist-edit').addEventListener('click', function () {
      openMaterialEdit(row, inv);
    });

    row.querySelector('.btn-sublist-delete').addEventListener('click', function () {
      AppDB.deleteInvestment(inv.id).then(function () { renderMonthly(); });
    });

    list.appendChild(row);
  });
}

function openMaterialEdit(row, inv) {
  row.innerHTML =
    '<input class="inline-edit-text" type="text" value="' + (inv.description || '') + '" />' +
    '<span class="sublist-right">' +
      '<input class="inline-edit-num" type="number" value="' + inv.amount + '" min="0" />' +
      '<button class="btn-sublist-save">Save</button>' +
      '<button class="btn-sublist-cancel">Cancel</button>' +
    '</span>';

  row.querySelector('.btn-sublist-save').addEventListener('click', function () {
    inv.description = row.querySelector('.inline-edit-text').value.trim();
    inv.amount      = parseFloat(row.querySelector('.inline-edit-num').value) || 0;
    AppDB.updateInvestment(inv).then(function () { renderMonthly(); });
  });

  row.querySelector('.btn-sublist-cancel').addEventListener('click', function () {
    renderMonthly();
  });
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
  document.getElementById('mat-desc').value    = '';
  document.getElementById('mat-amount').value  = '';
});

document.getElementById('btn-save-material').addEventListener('click', function () {
  var desc   = document.getElementById('mat-desc').value.trim();
  var amount = parseFloat(document.getElementById('mat-amount').value);

  if (isNaN(amount) || amount <= 0) {
    alert('Please enter a valid amount.');
    return;
  }

  // Use 1st of the viewed month so materials show in the right month
  var dateStr = getMonthKey() + '-01';

  AppDB.addInvestment({
    date:        dateStr,
    category:    'Materials',
    description: desc || 'Material cost',
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
