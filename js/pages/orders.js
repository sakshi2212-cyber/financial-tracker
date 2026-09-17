// orders.js — orders table with inline status dropdown, add/edit form

var editingOrderId = null;

var ORDER_STATUSES = ['Order Received', 'Payment Complete', 'In Progress', 'Order Shipped'];

var STATUS_STYLE = {
  'Order Received':    { background: '#DBEAFE', color: '#1D4ED8' },
  'Payment Complete':  { background: '#D1FAE5', color: '#065F46' },
  'In Progress':       { background: '#FEF3C7', color: '#92400E' },
  'Order Shipped':     { background: '#EDE9FE', color: '#4C1D95' },
  'Paid':              { background: '#D1FAE5', color: '#065F46' },
  'Pending':           { background: '#DBEAFE', color: '#1D4ED8' }
};

function applyStatusStyle(select) {
  var style = STATUS_STYLE[select.value] || STATUS_STYLE['Order Received'];
  select.style.background = style.background;
  select.style.color      = style.color;
}

function formatDate(dateStr) {
  var parts = dateStr.split('-');
  return parts[1] + '/' + parts[2] + '/' + parts[0];
}

function renderOrders() {
  AppDB.getOrders().then(function (orders) {
    var tbody = document.getElementById('orders-tbody');
    tbody.innerHTML = '';

    if (orders.length === 0) {
      tbody.innerHTML = '<tr class="empty-row"><td colspan="7">No orders yet. Click "+ Add Order" to get started.</td></tr>';
      return;
    }

    orders.sort(function (a, b) { return b.date.localeCompare(a.date); });

    orders.forEach(function (order) {
      var tr = document.createElement('tr');

      // ── Inline status dropdown ──────────────────────────────────────────
      var select = document.createElement('select');
      select.className = 'status-select';
      ORDER_STATUSES.forEach(function (s) {
        var opt = document.createElement('option');
        opt.value       = s;
        opt.textContent = s;
        if (s === order.status) { opt.selected = true; }
        select.appendChild(opt);
      });
      applyStatusStyle(select);

      // Auto-save when status changes — no button needed
      select.addEventListener('change', function () {
        order.status = this.value;
        applyStatusStyle(this);
        AppDB.updateOrder(order).then(function () {
          renderDashboard();
        });
      });

      var statusTd = document.createElement('td');
      statusTd.appendChild(select);

      // ── Other columns ───────────────────────────────────────────────────
      tr.innerHTML =
        '<td>' + formatDate(order.date) + '</td>' +
        '<td>' + (order.customer || '—') + '</td>' +
        '<td>' + (order.description || '—') + '</td>' +
        '<td>$' + order.amount.toLocaleString('en-US') + '</td>' +
        '<td>' + order.paymentMethod + '</td>' +
        '<td></td>' +
        '<td><button class="btn-row-edit">Edit</button></td>';

      // Slot the select into the empty 6th cell
      tr.cells[5].appendChild(select);

      // Edit button
      tr.querySelector('.btn-row-edit').addEventListener('click', function () {
        openEditForm(order);
      });

      tbody.appendChild(tr);
    });
  });
}

function openEditForm(order) {
  editingOrderId = order.id;

  document.getElementById('order-date').value        = order.date;
  document.getElementById('order-customer').value    = order.customer || '';
  document.getElementById('order-description').value = order.description || '';
  document.getElementById('order-amount').value      = order.amount;
  document.getElementById('order-payment').value     = order.paymentMethod;
  document.getElementById('order-status').value      = order.status;

  document.getElementById('order-form-title').textContent      = 'Edit Order';
  document.getElementById('btn-save-order').textContent        = 'Update Order';
  document.getElementById('form-add-order').style.display      = 'block';
  document.getElementById('btn-show-order-form').style.display = 'none';

  document.getElementById('form-add-order').scrollIntoView({ behavior: 'smooth', block: 'start' });
}

function resetOrderForm() {
  editingOrderId = null;
  document.getElementById('order-customer').value    = '';
  document.getElementById('order-description').value = '';
  document.getElementById('order-amount').value      = '';
  document.getElementById('order-status').value      = 'Order Received';
  document.getElementById('order-form-title').textContent      = 'New Order';
  document.getElementById('btn-save-order').textContent        = 'Save Order';
  document.getElementById('form-add-order').style.display      = 'none';
  document.getElementById('btn-show-order-form').style.display = 'inline-block';
}

document.getElementById('btn-show-order-form').addEventListener('click', function () {
  editingOrderId = null;
  document.getElementById('form-add-order').style.display      = 'block';
  document.getElementById('order-date').valueAsDate            = new Date();
  document.getElementById('order-form-title').textContent      = 'New Order';
  document.getElementById('btn-save-order').textContent        = 'Save Order';
  this.style.display = 'none';
});

document.getElementById('btn-cancel-order').addEventListener('click', resetOrderForm);

document.getElementById('btn-save-order').addEventListener('click', function () {
  var date   = document.getElementById('order-date').value;
  var amount = parseFloat(document.getElementById('order-amount').value);

  if (!date || isNaN(amount) || amount <= 0) {
    alert('Please fill in at least a date and a valid amount.');
    return;
  }

  var order = {
    date:          date,
    customer:      document.getElementById('order-customer').value.trim(),
    description:   document.getElementById('order-description').value.trim(),
    amount:        amount,
    paymentMethod: document.getElementById('order-payment').value,
    status:        document.getElementById('order-status').value
  };

  if (editingOrderId !== null) {
    order.id = editingOrderId;
    AppDB.updateOrder(order).then(function () { resetOrderForm(); renderOrders(); });
  } else {
    AppDB.addOrder(order).then(function () { resetOrderForm(); renderOrders(); });
  }
});
