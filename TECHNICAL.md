# Sticker Business Tracker — Technical Reference

A financial tracker for a small sticker business. Built with vanilla HTML/CSS/JavaScript,
IndexedDB for local storage, and deployed via GitHub Pages.

---

## Live URL

https://sakshi2212-cyber.github.io/financial-tracker/

---

## Tech Stack

| Technology     | Role                                      |
|----------------|-------------------------------------------|
| HTML           | Page structure                            |
| CSS            | Styling and layout                        |
| JavaScript     | App logic and interactivity               |
| IndexedDB      | Local database stored in the browser      |
| localStorage   | Simple key-value settings (e.g. salary)   |
| GitHub Pages   | Free static hosting, auto-deploys on push |

No frameworks. No build step. Open `index.html` in a browser and it works.

---

## File Structure

```
financial-tracker/
  index.html                  Single HTML file — all pages live here as hidden divs
  css/
    styles.css                All styling
  js/
    app.js                    Navigation router, app initialisation
    db.js                     IndexedDB module (AppDB)
    migrations.js             JSON schema versioning (Migrations, SCHEMA_VERSION)
    pages/
      dashboard.js            renderDashboard()
      orders.js               renderOrders(), form save handler
      investments.js          renderInvestments(), form save handler
      monthly.js              renderMonthly(), allocation save handler
      settings.js             Export, import, salary setting
  tests/
    run-tests.html            Open in browser to run migration tests
    migration.test.js         Migration unit tests (MigrationTests.runAll())
    fixtures/
      export_v1.json          Sample v1 backup file for testing
```

---

## Data Model (Schema Version 1)

### Order
```json
{
  "id":            1,
  "date":          "2026-09-01",
  "customer":      "Emma",
  "description":   "Custom name stickers x 5",
  "amount":        15,
  "paymentMethod": "Cash | UPI | Bank Transfer",
  "status":        "Paid | Pending"
}
```

### Investment
```json
{
  "id":          1,
  "date":        "2026-08-01",
  "category":    "Initial Setup | Materials | Equipment | Upgrade",
  "description": "Vinyl rolls A4 x 50 sheets",
  "amount":      40
}
```

### Monthly Allocation
```json
{
  "monthKey": "2026-09",
  "roi":      10,
  "buffer":   5,
  "forward":  10
}
```
`monthKey` format is always `YYYY-MM`. Personal income is derived:
`totalMonthIncome - (roi + buffer + forward)`.

---

## Storage

| Data                  | Storage      | Key                          |
|-----------------------|--------------|------------------------------|
| Orders                | IndexedDB    | store: `orders`              |
| Investments           | IndexedDB    | store: `investments`         |
| Monthly allocations   | IndexedDB    | store: `monthlyAllocations`  |
| Minimum salary        | localStorage | `minSalary`                  |

IndexedDB database name: `sticker-tracker`, version: `1`.

---

## Key Modules

### AppDB (`js/db.js`)
All IndexedDB operations. Returns Promises.

| Method                    | Description                          |
|---------------------------|--------------------------------------|
| `AppDB.addOrder(o)`       | Insert a new order                   |
| `AppDB.getOrders()`       | Get all orders                       |
| `AppDB.addInvestment(i)`  | Insert a new investment              |
| `AppDB.getInvestments()`  | Get all investments                  |
| `AppDB.saveAllocation(a)` | Insert or update a monthly allocation|
| `AppDB.getAllocation(key)`| Get allocation for a month key       |
| `AppDB.getAllData()`      | Get all data (used for export)       |
| `AppDB.importAllData(d)`  | Clear all stores and re-import       |

### Migrations (`js/migrations.js`)
| Symbol                      | Description                              |
|-----------------------------|------------------------------------------|
| `SCHEMA_VERSION`            | Current schema version number (integer)  |
| `Migrations.migrate(data)`  | Runs all migrations in sequence          |

---

## Backup / Restore (JSON Export)

### Export format
```json
{
  "version":    1,
  "exportedAt": "2026-09-10T10:00:00.000Z",
  "orders":     [ ... ],
  "investments": [ ... ],
  "monthlyAllocations": [ ... ]
}
```

### How to add a new field to the schema
1. Add the field to the relevant JavaScript objects in the page files
2. Bump `DB_VERSION` in `js/db.js` and add a new store or index in `onupgradeneeded` if needed
3. Bump `SCHEMA_VERSION` in `js/migrations.js`
4. Write a new migration function `toV<N>(data)` that adds the field with a safe default
5. Call it inside `migrate()`: `if (version < N) { data = toVN(data); }`
6. Copy `tests/fixtures/export_v1.json` to `export_v<previous>.json` as the old fixture
7. Add tests in `migration.test.js` for the new migration

---

## Deployment

Push to `main` branch. GitHub Pages auto-deploys within ~1 minute.

```bash
git add <files>
git commit -m "description of change"
git push origin main
```

To run migration tests: open `tests/run-tests.html` directly in a browser.

---

## Design Decisions

- **No framework** — vanilla JS keeps the build step-free. GitHub Pages serves the files directly.
- **No backend** — IndexedDB handles all data locally. No server costs or maintenance.
- **JSON backup instead of cloud sync** — single-laptop use case. User saves backup to Google Drive manually.
- **Versioned JSON schema** — every backup file includes a `version` number so future schema changes can be migrated automatically on import.
- **localStorage for settings** — salary and other simple settings don't need IndexedDB's overhead.
- **USD currency** — business operates in USD.
- **Minimum salary warning** — alerts when monthly allocations would leave personal income below the configured floor.
