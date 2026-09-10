// settings.js — salary, GitHub token, publish snapshot, export, import

var GITHUB_OWNER = 'sakshi2212-cyber';
var GITHUB_REPO  = 'financial-tracker';
var SNAPSHOT_PATH = 'snapshot.json';

// ── Salary ───────────────────────────────────────────────────────────────────

var savedSalary = localStorage.getItem('minSalary');
if (savedSalary) { document.getElementById('setting-salary').value = savedSalary; }

document.getElementById('btn-save-salary').addEventListener('click', function () {
  var value = parseFloat(document.getElementById('setting-salary').value) || 0;
  localStorage.setItem('minSalary', value);
  var msg = document.getElementById('salary-saved-msg');
  msg.style.display = 'inline';
  setTimeout(function () { msg.style.display = 'none'; }, 2000);
});

// ── GitHub Token ─────────────────────────────────────────────────────────────

// Show a placeholder if a token is already saved (don't show the actual token)
if (localStorage.getItem('githubToken')) {
  document.getElementById('setting-token').placeholder = 'Token saved — enter a new one to replace';
}

document.getElementById('btn-save-token').addEventListener('click', function () {
  var value = document.getElementById('setting-token').value.trim();
  if (value) {
    localStorage.setItem('githubToken', value);
    document.getElementById('setting-token').value = '';
    document.getElementById('setting-token').placeholder = 'Token saved — enter a new one to replace';
  }
  var msg = document.getElementById('token-saved-msg');
  msg.style.display = 'inline';
  setTimeout(function () { msg.style.display = 'none'; }, 2000);
});

// ── Last Published display ────────────────────────────────────────────────────

function updateLastPublished() {
  var ts = localStorage.getItem('lastPublished');
  var el = document.getElementById('last-published-msg');
  if (ts) {
    var d = new Date(ts);
    el.textContent = 'Last published: ' + d.toLocaleDateString('en-US', {
      month: 'short', day: 'numeric', year: 'numeric'
    }) + ' at ' + d.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' });
  } else {
    el.textContent = 'Not published yet';
  }
}

updateLastPublished();

// ── Publish Snapshot ─────────────────────────────────────────────────────────

document.getElementById('btn-publish').addEventListener('click', function () {
  var token = localStorage.getItem('githubToken');
  if (!token) {
    alert('Please save a GitHub Personal Access Token first.');
    return;
  }

  var btn = document.getElementById('btn-publish');
  btn.textContent = 'Publishing...';
  btn.disabled = true;

  AppDB.getAllData().then(function (data) {
    data.version     = SCHEMA_VERSION;
    data.publishedAt = new Date().toISOString();

    // btoa() only handles ASCII, so we encode Unicode characters first
    var jsonStr = JSON.stringify(data, null, 2);
    var content = btoa(unescape(encodeURIComponent(jsonStr)));

    var apiUrl  = 'https://api.github.com/repos/' + GITHUB_OWNER + '/' + GITHUB_REPO + '/contents/' + SNAPSHOT_PATH;
    var headers = {
      'Authorization': 'Bearer ' + token,
      'Accept': 'application/vnd.github.v3+json',
      'Content-Type': 'application/json'
    };

    // GitHub requires the current file's SHA when updating an existing file
    fetch(apiUrl, { headers: headers })
      .then(function (res) { return res.ok ? res.json() : null; })
      .then(function (existing) {
        var body = {
          message: 'Update dashboard snapshot',
          content: content
        };
        if (existing && existing.sha) { body.sha = existing.sha; }

        return fetch(apiUrl, {
          method: 'PUT',
          headers: headers,
          body: JSON.stringify(body)
        });
      })
      .then(function (res) {
        if (res.ok) {
          localStorage.setItem('lastPublished', new Date().toISOString());
          updateLastPublished();
          btn.textContent = 'Published!';
          setTimeout(function () {
            btn.textContent = 'Publish Snapshot';
            btn.disabled = false;
          }, 2000);
        } else {
          return res.json().then(function (err) { throw new Error(err.message || 'Unknown error'); });
        }
      })
      .catch(function (err) {
        alert('Publish failed: ' + err.message + '\n\nMake sure your token has Contents write permission.');
        btn.textContent = 'Publish Snapshot';
        btn.disabled = false;
      });
  });
});

// ── Export ───────────────────────────────────────────────────────────────────

document.getElementById('btn-export').addEventListener('click', function () {
  AppDB.getAllData().then(function (data) {
    data.version    = SCHEMA_VERSION;
    data.exportedAt = new Date().toISOString();

    var json = JSON.stringify(data, null, 2);
    var blob = new Blob([json], { type: 'application/json' });
    var url  = URL.createObjectURL(blob);
    var date = new Date().toISOString().split('T')[0];

    var a      = document.createElement('a');
    a.href     = url;
    a.download = 'sticker-tracker-backup-' + date + '.json';
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
    try { raw = JSON.parse(e.target.result); }
    catch (err) { alert('Could not read the file. Make sure it is a valid backup JSON file.'); return; }

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
