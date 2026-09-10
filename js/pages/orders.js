// orders.js — orders table rendering and form handling

function formatDate(dateStr) {
  var parts = dateStr.split('-');
  return parts[1] + '/' + parts[2] + '/' + parts[0];
}

function renderOrders() {
  AppDB.getOrders().then(function (orders) {
    var tbody = document.getElementById('orders-tbody');
    tbody.innerHTML = '';

    if (orders.length === 0) {
      tbody.innerHTML = '<tr class="empty-row"><td colspan="6">No orders yet. Click "+ Add Order" to get started.</td></tr>';
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
        '<td><span class="badge badge-' + order.status.toLowerCase() + '">' + order.status + '</span></td>';
      tbody.appendChild(tr);
    });
  });
}

document.getElementById('btn-show-order-form').addEventListener('click', function () {
  document.getElementById('form-add-order').style.display = 'block';
  document.getElementById('order-date').valueAsDate = new Date();
  this.style.display = 'none';
});

document.getElementById('btn-cancel-order').addEventListener('click', function () {
  document.getElementById('form-add-order').style.display = 'none';
  document.getElementById('btn-show-order-form').style.display = 'inline-block';
});

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

  AppDB.addOrder(order).then(function () {
    document.getElementById('order-customer').value    = '';
    document.getElementById('order-description').value = '';
    document.getElementById('order-amount').value      = '';

    document.getElementById('form-add-order').style.display          = 'none';
    document.getElementById('btn-show-order-form').style.display = 'inline-block';

    renderOrders();
  });
});
