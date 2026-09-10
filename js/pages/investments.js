// investments.js — investments table rendering and form handling

function renderInvestments() {
  AppDB.getInvestments().then(function (investments) {
    var tbody = document.getElementById('investments-tbody');
    tbody.innerHTML = '';

    if (investments.length === 0) {
      tbody.innerHTML = '<tr class="empty-row"><td colspan="4">No investments recorded yet. Click "+ Add Investment" to get started.</td></tr>';
      return;
    }

    investments.sort(function (a, b) { return b.date.localeCompare(a.date); });

    investments.forEach(function (inv) {
      var tr = document.createElement('tr');
      tr.innerHTML =
        '<td>' + formatDate(inv.date) + '</td>' +
        '<td><span class="badge badge-category">' + inv.category + '</span></td>' +
        '<td>' + (inv.description || '—') + '</td>' +
        '<td>$' + inv.amount.toLocaleString('en-US') + '</td>';
      tbody.appendChild(tr);
    });
  });
}

document.getElementById('btn-show-investment-form').addEventListener('click', function () {
  document.getElementById('form-add-investment').style.display = 'block';
  document.getElementById('investment-date').valueAsDate = new Date();
  this.style.display = 'none';
});

document.getElementById('btn-cancel-investment').addEventListener('click', function () {
  document.getElementById('form-add-investment').style.display = 'none';
  document.getElementById('btn-show-investment-form').style.display = 'inline-block';
});

document.getElementById('btn-save-investment').addEventListener('click', function () {
  var date   = document.getElementById('investment-date').value;
  var amount = parseFloat(document.getElementById('investment-amount').value);

  if (!date || isNaN(amount) || amount <= 0) {
    alert('Please fill in at least a date and a valid amount.');
    return;
  }

  var investment = {
    date:        date,
    category:    document.getElementById('investment-category').value,
    description: document.getElementById('investment-description').value.trim(),
    amount:      amount
  };

  AppDB.addInvestment(investment).then(function () {
    document.getElementById('investment-description').value = '';
    document.getElementById('investment-amount').value      = '';

    document.getElementById('form-add-investment').style.display       = 'none';
    document.getElementById('btn-show-investment-form').style.display  = 'inline-block';

    renderInvestments();
  });
});
