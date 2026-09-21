// migrations.js — JSON schema versioning and backwards-compatible import

var SCHEMA_VERSION = 3;

var Migrations = (function () {

  function migrate(data) {
    var version = data.version || 0;
    if (version < 1) { data = toV1(data); }
    if (version < 2) { data = toV2(data); }
    if (version < 3) { data = toV3(data); }
    return data;
  }

  function toV1(data) {
    if (!Array.isArray(data.orders))             { data.orders = []; }
    if (!Array.isArray(data.investments))        { data.investments = []; }
    if (!Array.isArray(data.monthlyAllocations)) { data.monthlyAllocations = []; }
    data.orders = data.orders.map(function (o) {
      return {
        id: o.id || undefined, date: o.date || '', customer: o.customer || '',
        description: o.description || '', amount: o.amount || 0,
        paymentMethod: o.paymentMethod || 'Unknown', status: o.status || 'Paid'
      };
    });
    data.investments = data.investments.map(function (i) {
      return {
        id: i.id || undefined, date: i.date || '', category: i.category || 'Materials',
        description: i.description || '', amount: i.amount || 0
      };
    });
    data.version = 1;
    return data;
  }

  // V2: Paid/Pending → 4-step order lifecycle
  function toV2(data) {
    data.orders = data.orders.map(function (o) {
      if (o.status === 'Paid')    { o.status = 'Order Shipped'; }
      if (o.status === 'Pending') { o.status = 'Order Received'; }
      return o;
    });
    data.version = 2;
    return data;
  }

  // V3: monthly allocation simplified — only stores { monthKey, recover }
  //   roi    → recover
  //   buffer → dropped (savings is now auto-calculated)
  //   forward → dropped
  function toV3(data) {
    data.monthlyAllocations = data.monthlyAllocations.map(function (a) {
      return {
        monthKey: a.monthKey,
        recover:  a.recover !== undefined ? a.recover : (a.roi || 0)
      };
    });
    data.version = 3;
    return data;
  }

  return { migrate: migrate };
})();
