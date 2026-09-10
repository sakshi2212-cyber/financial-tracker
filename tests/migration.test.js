// migration.test.js — verifies old backup files can be migrated to the current schema
// Run by opening tests/run-tests.html in your browser

var MigrationTests = (function () {
  var passed = 0;
  var failed = 0;

  function assert(description, condition) {
    if (condition) {
      passed++;
      return { ok: true, description: description };
    } else {
      failed++;
      return { ok: false, description: description };
    }
  }

  function runAll() {
    var results = [];

    // ── V1 fixture tests ─────────────────────────────────────────────────────

    var v1 = {
      "version": 1,
      "orders": [
        { "id": 1, "date": "2026-09-01", "customer": "Emma",
          "description": "Stickers", "amount": 15,
          "paymentMethod": "Cash", "status": "Paid" }
      ],
      "investments": [
        { "id": 1, "date": "2026-08-01", "category": "Initial Setup",
          "description": "Vinyl rolls", "amount": 40 }
      ],
      "monthlyAllocations": [
        { "monthKey": "2026-09", "roi": 10, "buffer": 5, "forward": 10 }
      ]
    };

    var migratedV1 = Migrations.migrate(JSON.parse(JSON.stringify(v1)));
    results.push(assert('V1: version stays at 1',           migratedV1.version === 1));
    results.push(assert('V1: orders array preserved',       migratedV1.orders.length === 1));
    results.push(assert('V1: investments array preserved',  migratedV1.investments.length === 1));
    results.push(assert('V1: allocations array preserved',  migratedV1.monthlyAllocations.length === 1));
    results.push(assert('V1: order amount preserved',       migratedV1.orders[0].amount === 15));

    // ── Missing fields get defaults ──────────────────────────────────────────

    var noVersion = {
      "orders": [{ "id": 1, "date": "2026-09-01", "amount": 20 }],
      "investments": [],
      "monthlyAllocations": []
    };

    var migratedNoVer = Migrations.migrate(JSON.parse(JSON.stringify(noVersion)));
    results.push(assert('No version: migrates to v1',                migratedNoVer.version === 1));
    results.push(assert('No version: missing paymentMethod defaults', migratedNoVer.orders[0].paymentMethod === 'Unknown'));
    results.push(assert('No version: missing status defaults',        migratedNoVer.orders[0].status === 'Paid'));

    // ── Completely empty backup ──────────────────────────────────────────────

    var empty = {};
    var migratedEmpty = Migrations.migrate(JSON.parse(JSON.stringify(empty)));
    results.push(assert('Empty backup: orders array created',       Array.isArray(migratedEmpty.orders)));
    results.push(assert('Empty backup: investments array created',  Array.isArray(migratedEmpty.investments)));
    results.push(assert('Empty backup: allocations array created',  Array.isArray(migratedEmpty.monthlyAllocations)));

    return { results: results, passed: passed, failed: failed };
  }

  return { runAll: runAll };
})();
