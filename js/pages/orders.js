// orders.js — show/hide the add order form

document.getElementById('btn-show-order-form').addEventListener('click', function () {
  const form = document.getElementById('form-add-order');
  form.style.display = 'block';
  document.getElementById('order-date').valueAsDate = new Date();
  this.style.display = 'none';
});

document.getElementById('btn-cancel-order').addEventListener('click', function () {
  document.getElementById('form-add-order').style.display = 'none';
  document.getElementById('btn-show-order-form').style.display = 'inline-block';
});
