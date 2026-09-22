// investments.js — investments table with edit/delete and recovery progress

var editingInvestmentId = null;

function renderInvestments() {
  AppDB.getAllData().then(function (data) {
    var investments = data.investments;
    var allocations = data.monthlyAllocations;

    // ── Recovery progress ─────────────────────────────────────────────────

    var totalInvested  = investments.reduce(function (s, i) { return s + i.amount; }, 0);
    var totalReturned  = allocations.reduce(function (s, a) { return s + (a.recover || 0); }, 0);
    var stillToRecover = Math.max(0, totalInvested - totalReturned);
    var pct = totalInvested > 0 ? Math.min(100, Math.round((totalReturned / totalInvested) * 100)) : 0;

    document.getElementById('inv-total-invested').textContent   = '$' + totalInvested.toLocaleString('en-US');
    document.getElementById('inv-total-returned').textContent   = '$' + totalReturned.toLocaleString('en-US');
    document.getElementById('inv-still-to-recover').textContent = '$' + stillToRecover.toLocaleString('en-US');
    document.getElementById('inv-recovery-bar').style.width     = pct + '%';
    document.getElementById('inv-recovery-pct').textContent     = pct + '% recovered';

    // ── Investments table ─────────────────────────────────────────────────

    var tbody = document.getElementById('investments-tbody');
    tbody.innerHTML = '';

    if (investments.length === 0) {
      tbody.innerHTML = '<tr class="empty-row"><td colspan="5">No investments recorded yet. Click "+ Add Investment" to get started.</td></tr>';
      return;
    }

    investments.sort(function (a, b) { return b.date.localeCompare(a.date); });

    investments.forEach(function (inv) {
      var tr = document.createElement('tr');
      tr.innerHTML =
        '<td>' + formatDate(inv.date) + '</td>' +
        '<td><span class="badge badge-category">' + inv.category + '</span></td>' +
        '<td>' + (inv.description || '—') + '</td>' +
        '<td>$' + inv.amount.toLocaleString('en-US') + '</td>' +
        '<td>' +
          '<button class="btn-row-edit btn-inv-edit">Edit</button> ' +
          '<button class="btn-row-edit btn-inv-delete" style="border-color:#fecaca;color:#DC2626;">Delete</button>' +
        '</td>';

      tr.querySelector('.btn-inv-edit').addEventListener('click', function () {
        openInvestmentEditForm(inv);
      });

      tr.querySelector('.btn-inv-delete').addEventListener('click', function () {
        if (confirm('Delete this investment? This cannot be undone.')) {
          AppDB.deleteInvestment(inv.id).then(renderInvestments);
        }
      });

      tbody.appendChild(tr);
    });
  });
}

function openInvestmentEditForm(inv) {
  editingInvestmentId = inv.id;
  document.getElementById('investment-date').value        = inv.date;
  document.getElementById('investment-category').value    = inv.category;
  document.getElementById('investment-description').value = inv.description || '';
  document.getElementById('investment-amount').value      = inv.amount;
  document.getElementById('investment-form-title').textContent   = 'Edit Investment';
  document.getElementById('btn-save-investment').textContent     = 'Update Investment';
  document.getElementById('form-add-investment').style.display   = 'block';
  document.getElementById('btn-show-investment-form').style.display = 'none';
  document.getElementById('form-add-investment').scrollIntoView({ behavior: 'smooth', block: 'start' });
}

function resetInvestmentForm() {
  editingInvestmentId = null;
  document.getElementById('investment-description').value = '';
  document.getElementById('investment-amount').value      = '';
  document.getElementById('investment-form-title').textContent      = 'New Investment';
  document.getElementById('btn-save-investment').textContent        = 'Save Investment';
  document.getElementById('form-add-investment').style.display      = 'none';
  document.getElementById('btn-show-investment-form').style.display = 'inline-block';
}

document.getElementById('btn-show-investment-form').addEventListener('click', function () {
  editingInvestmentId = null;
  document.getElementById('form-add-investment').style.display      = 'block';
  document.getElementById('investment-date').valueAsDate            = new Date();
  document.getElementById('investment-form-title').textContent      = 'New Investment';
  document.getElementById('btn-save-investment').textContent        = 'Save Investment';
  this.style.display = 'none';
});

document.getElementById('btn-cancel-investment').addEventListener('click', resetInvestmentForm);

document.getElementById('btn-save-investment').addEventListener('click', function () {
  var date   = document.getElementById('investment-date').value;
  var amount = parseFloat(document.getElementById('investment-amount').value);

  if (!date || isNaN(amount) || amount <= 0) {
    alert('Please fill in at least a date and a valid amount.');
    return;
  }

  var inv = {
    date:        date,
    category:    document.getElementById('investment-category').value,
    description: document.getElementById('investment-description').value.trim(),
    amount:      amount
  };

  if (editingInvestmentId !== null) {
    inv.id = editingInvestmentId;
    AppDB.updateInvestment(inv).then(function () { resetInvestmentForm(); renderInvestments(); });
  } else {
    AppDB.addInvestment(inv).then(function () { resetInvestmentForm(); renderInvestments(); });
  }
});
