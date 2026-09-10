// migrations.js — JSON schema versioning and backwards-compatible import
//
// Every time the data structure changes, bump SCHEMA_VERSION by 1
// and add a migration function below. The migrate() function runs
// each step in sequence so any old backup file can reach the current version.

var SCHEMA_VERSION = 1;

var Migrations = (function () {

  function migrate(data) {
    var version = data.version || 0;
    if (version < 1) { data = toV1(data); }
    // Future: if (version < 2) { data = toV2(data); }
    return data;
  }

  // V1: initial schema — ensures all required keys exist with safe defaults
  function toV1(data) {
    if (!Array.isArray(data.orders))             { data.orders = []; }
    if (!Array.isArray(data.investments))        { data.investments = []; }
    if (!Array.isArray(data.monthlyAllocations)) { data.monthlyAllocations = []; }

    // Ensure every order has all v1 fields
    data.orders = data.orders.map(function (o) {
      return {
        id:            o.id            || undefined,
        date:          o.date          || '',
        customer:      o.customer      || '',
        description:   o.description   || '',
        amount:        o.amount        || 0,
        paymentMethod: o.paymentMethod || 'Unknown',
        status:        o.status        || 'Paid'
      };
    });

    // Ensure every investment has all v1 fields
    data.investments = data.investments.map(function (i) {
      return {
        id:          i.id          || undefined,
        date:        i.date        || '',
        category:    i.category    || 'Materials',
        description: i.description || '',
        amount:      i.amount      || 0
      };
    });

    data.version = 1;
    return data;
  }

  return { migrate: migrate };
})();
