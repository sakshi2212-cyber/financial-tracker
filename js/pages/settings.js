// settings.js — salary setting, data export, and data import

// ── Salary ──────────────────────────────────────────────────────────────────

var savedSalary = localStorage.getItem('minSalary');
if (savedSalary) { document.getElementById('setting-salary').value = savedSalary; }

document.getElementById('btn-save-salary').addEventListener('click', function () {
  var value = parseFloat(document.getElementById('setting-salary').value) || 0;
  localStorage.setItem('minSalary', value);

  var msg = document.getElementById('salary-saved-msg');
  msg.style.display = 'inline';
  setTimeout(function () { msg.style.display = 'none'; }, 2000);
});

// ── Export ───────────────────────────────────────────────────────────────────

document.getElementById('btn-export').addEventListener('click', function () {
  AppDB.getAllData().then(function (data) {
    data.version    = SCHEMA_VERSION;
    data.exportedAt = new Date().toISOString();

    var json     = JSON.stringify(data, null, 2);
    var blob     = new Blob([json], { type: 'application/json' });
    var url      = URL.createObjectURL(blob);
    var date     = new Date().toISOString().split('T')[0];

    var a        = document.createElement('a');
    a.href       = url;
    a.download   = 'sticker-tracker-backup-' + date + '.json';
    a.click();

    URL.revokeObjectURL(url);
  });
});

// ── Import ───────────────────────────────────────────────────────────────────

document.getElementById('input-import').addEventListener('change', function () {
  var file = this.files[0];
  if (file) {
    document.getElementById('import-filename').textContent = file.name;
    document.getElementById('btn-import').disabled = false;
  } else {
    document.getElementById('import-filename').textContent = 'No file chosen';
    document.getElementById('btn-import').disabled = true;
  }
});

document.getElementById('btn-import').addEventListener('click', function () {
  var file = document.getElementById('input-import').files[0];
  if (!file) { return; }

  if (!confirm('This will replace ALL existing data with the contents of the backup file. Are you sure?')) {
    return;
  }

  var reader = new FileReader();

  reader.onload = function (e) {
    var raw;
    try {
      raw = JSON.parse(e.target.result);
    } catch (err) {
      alert('Could not read the file. Make sure it is a valid backup JSON file.');
      return;
    }

    var migrated = Migrations.migrate(raw);

    AppDB.importAllData(migrated).then(function () {
      alert('Data imported successfully! The page will now refresh.');
      window.location.reload();
    }).catch(function (err) {
      alert('Import failed: ' + err.message);
    });
  };

  reader.readAsText(file);
});
