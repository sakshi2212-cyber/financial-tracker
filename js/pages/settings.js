// settings.js — export/import UI interactions (actual data logic added in Phase 3)

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
