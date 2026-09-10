// app.js — entry point, handles navigation between pages

function navigateTo(pageName) {
  document.querySelectorAll('.page').forEach(p => p.classList.remove('active'));
  document.querySelectorAll('.nav-links a').forEach(a => a.classList.remove('active'));

  document.getElementById('page-' + pageName).classList.add('active');
  document.querySelector('[data-page="' + pageName + '"]').classList.add('active');
}

document.querySelectorAll('.nav-links a').forEach(link => {
  link.addEventListener('click', function (e) {
    e.preventDefault();
    navigateTo(this.dataset.page);
  });
});
