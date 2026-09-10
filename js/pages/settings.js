// settings.js — settings UI: salary, export/import (data logic added in Phase 3)

// Load saved salary into the input on page load
const savedSalary = localStorage.getItem('minSalary');
if (savedSalary) {
  document.getElementById('setting-salary').value = savedSalary;
}

// Save salary to localStorage when Save is clicked
document.getElementById('btn-save-salary').addEventListener('click', function () {
  const value = parseFloat(document.getElementById('setting-salary').value) || 0;
  localStorage.setItem('minSalary', value);

  // Show a brief "Saved!" confirmation then hide it
  const msg = document.getElementById('salary-saved-msg');
  msg.style.display = 'inline';
  setTimeout(function () { msg.style.display = 'none'; }, 2000);
});

// Show chosen filename when a backup file is selected
document.getElementById('input-import').addEventListener('change', function () {
  const file = this.files[0];
  if (file) {
    document.getElementById('import-filename').textContent = file.name;
    document.getElementById('btn-import').disabled = false;
  } else {
    document.getElementById('import-filename').textContent = 'No file chosen';
    document.getElementById('btn-import').disabled = true;
  }
});
