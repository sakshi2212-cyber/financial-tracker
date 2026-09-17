// migrations.js — JSON schema versioning and backwards-compatible import
//
// Every time the data structure changes, bump SCHEMA_VERSION by 1
// and add a migration function below. The migrate() function runs
// each step in sequence so any old backup file can reach the current version.

var SCHEMA_VERSION = 2;

var Migrations = (function () {

  function migrate(data) {
    var version = data.version || 0;
    if (version < 1) { data = toV1(data); }
    if (version < 2) { data = toV2(data); }
    // Future: if (version < 3) { data = toV3(data); }
    return data;
  }

  // V1: initial schema — ensures all required keys exist with safe defaults
  function toV1(data) {
    if (!Array.isArray(data.orders))             { data.orders = []; }
    if (!Array.isArray(data.investments))        { data.investments = []; }
    if (!Array.isArray(data.monthlyAllocations)) { data.monthlyAllocations = []; }

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

  // V2: replace Paid/Pending with 4-step order lifecycle
  //   "Paid"    → "Order Shipped"   (was complete, assume delivered)
  //   "Pending" → "Order Received"  (was not yet paid, treat as new order)
  function toV2(data) {
    data.orders = data.orders.map(function (o) {
      if (o.status === 'Paid')    { o.status = 'Order Shipped'; }
      if (o.status === 'Pending') { o.status = 'Order Received'; }
      return o;
    });
    data.version = 2;
    return data;
  }

  return { migrate: migrate };
})();
