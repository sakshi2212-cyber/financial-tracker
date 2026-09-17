// orders.js — orders table rendering, add and edit form handling

var editingOrderId = null;

function formatDate(dateStr) {
  var parts = dateStr.split('-');
  return parts[1] + '/' + parts[2] + '/' + parts[0];
}

var STATUS_BADGE = {
  'Order Received':    'badge-received',
  'Payment Complete':  'badge-payment-complete',
  'In Progress':       'badge-in-progress',
  'Order Shipped':     'badge-shipped',
  'Paid':              'badge-paid',
  'Pending':           'badge-pending'
};

function statusBadge(status) {
  var cls = STATUS_BADGE[status] || 'badge-received';
  return '<span class="badge ' + cls + '">' + status + '</span>';
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
      tr.innerHTML =
        '<td>' + formatDate(order.date) + '</td>' +
        '<td>' + (order.customer || '—') + '</td>' +
        '<td>' + (order.description || '—') + '</td>' +
        '<td>$' + order.amount.toLocaleString('en-US') + '</td>' +
        '<td>' + order.paymentMethod + '</td>' +
        '<td>' + statusBadge(order.status) + '</td>' +
        '<td><button class="btn-row-edit" data-id="' + order.id + '">Edit</button></td>';
      tbody.appendChild(tr);
    });

    // Attach edit button listeners after rows are rendered
    tbody.querySelectorAll('.btn-row-edit').forEach(function (btn) {
      btn.addEventListener('click', function () {
        var id = parseInt(this.dataset.id);
        AppDB.getOrders().then(function (all) {
          var order = all.find(function (o) { return o.id === id; });
          if (order) { openEditForm(order); }
        });
      });
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
  document.getElementById('form-add-order').style.display = 'block';
  document.getElementById('order-date').valueAsDate = new Date();
  document.getElementById('order-form-title').textContent = 'New Order';
  document.getElementById('btn-save-order').textContent   = 'Save Order';
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
    AppDB.updateOrder(order).then(function () {
      resetOrderForm();
      renderOrders();
    });
  } else {
    AppDB.addOrder(order).then(function () {
      resetOrderForm();
      renderOrders();
    });
  }
});
