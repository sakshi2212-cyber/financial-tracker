// investments.js — show/hide the add investment form

document.getElementById('btn-show-investment-form').addEventListener('click', function () {
  const form = document.getElementById('form-add-investment');
  form.style.display = 'block';
  document.getElementById('investment-date').valueAsDate = new Date();
  this.style.display = 'none';
});

document.getElementById('btn-cancel-investment').addEventListener('click', function () {
  document.getElementById('form-add-investment').style.display = 'none';
  document.getElementById('btn-show-investment-form').style.display = 'inline-block';
});
