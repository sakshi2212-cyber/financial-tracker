// db.js — IndexedDB setup and all database operations

var AppDB = (function () {
  var DB_NAME    = 'sticker-tracker';
  var DB_VERSION = 2; // bumped to add materialCosts store
  var _db        = null;

  function open() {
    return new Promise(function (resolve, reject) {
      if (_db) { resolve(_db); return; }

      var request = indexedDB.open(DB_NAME, DB_VERSION);

      request.onupgradeneeded = function (event) {
        var db = event.target.result;

        if (!db.objectStoreNames.contains('orders')) {
          var ordersStore = db.createObjectStore('orders', { keyPath: 'id', autoIncrement: true });
          ordersStore.createIndex('date', 'date', { unique: false });
        }

        if (!db.objectStoreNames.contains('investments')) {
          var investStore = db.createObjectStore('investments', { keyPath: 'id', autoIncrement: true });
          investStore.createIndex('date', 'date', { unique: false });
        }

        if (!db.objectStoreNames.contains('monthlyAllocations')) {
          db.createObjectStore('monthlyAllocations', { keyPath: 'monthKey' });
        }

        // New in v2: material costs are separate from investments
        if (!db.objectStoreNames.contains('materialCosts')) {
          var mcStore = db.createObjectStore('materialCosts', { keyPath: 'id', autoIncrement: true });
          mcStore.createIndex('monthKey', 'monthKey', { unique: false });
        }
      };

      request.onsuccess = function (event) { _db = event.target.result; resolve(_db); };
      request.onerror   = function (event) { reject(event.target.error); };
    });
  }

  function addRecord(storeName, record) {
    return open().then(function (db) {
      return new Promise(function (resolve, reject) {
        var tx = db.transaction(storeName, 'readwrite');
        var req = tx.objectStore(storeName).add(record);
        req.onsuccess = function () { resolve(req.result); };
        req.onerror   = function () { reject(req.error); };
      });
    });
  }

  function putRecord(storeName, record) {
    return open().then(function (db) {
      return new Promise(function (resolve, reject) {
        var tx = db.transaction(storeName, 'readwrite');
        var req = tx.objectStore(storeName).put(record);
        req.onsuccess = function () { resolve(req.result); };
        req.onerror   = function () { reject(req.error); };
      });
    });
  }

  function getAllRecords(storeName) {
    return open().then(function (db) {
      return new Promise(function (resolve, reject) {
        var tx = db.transaction(storeName, 'readonly');
        var req = tx.objectStore(storeName).getAll();
        req.onsuccess = function () { resolve(req.result); };
        req.onerror   = function () { reject(req.error); };
      });
    });
  }

  function getRecord(storeName, key) {
    return open().then(function (db) {
      return new Promise(function (resolve, reject) {
        var tx = db.transaction(storeName, 'readonly');
        var req = tx.objectStore(storeName).get(key);
        req.onsuccess = function () { resolve(req.result || null); };
        req.onerror   = function () { reject(req.error); };
      });
    });
  }

  function deleteRecord(storeName, id) {
    return open().then(function (db) {
      return new Promise(function (resolve, reject) {
        var tx  = db.transaction(storeName, 'readwrite');
        var req = tx.objectStore(storeName).delete(id);
        req.onsuccess = function () { resolve(); };
        req.onerror   = function () { reject(req.error); };
      });
    });
  }

  function clearStore(storeName) {
    return open().then(function (db) {
      return new Promise(function (resolve, reject) {
        var tx  = db.transaction(storeName, 'readwrite');
        var req = tx.objectStore(storeName).clear();
        req.onsuccess = function () { resolve(); };
        req.onerror   = function () { reject(req.error); };
      });
    });
  }

  return {
    // Orders
    addOrder:         function (o)  { return addRecord('orders', o); },
    updateOrder:      function (o)  { return putRecord('orders', o); },
    getOrders:        function ()   { return getAllRecords('orders'); },

    // Investments (capital tracking)
    addInvestment:    function (i)  { return addRecord('investments', i); },
    updateInvestment: function (i)  { return putRecord('investments', i); },
    deleteInvestment: function (id) { return deleteRecord('investments', id); },
    getInvestments:   function ()   { return getAllRecords('investments'); },

    // Monthly allocations
    saveAllocation:    function (a)   { return putRecord('monthlyAllocations', a); },
    getAllocation:      function (key) { return getRecord('monthlyAllocations', key); },
    getAllAllocations:  function ()    { return getAllRecords('monthlyAllocations'); },

    // Material costs (separate from investments, for production cost tracking)
    addMaterialCost:    function (mc)  { return addRecord('materialCosts', mc); },
    updateMaterialCost: function (mc)  { return putRecord('materialCosts', mc); },
    deleteMaterialCost: function (id)  { return deleteRecord('materialCosts', id); },
    getMaterialCosts:   function ()    { return getAllRecords('materialCosts'); },

    getAllData: function () {
      return Promise.all([
        getAllRecords('orders'),
        getAllRecords('investments'),
        getAllRecords('monthlyAllocations'),
        getAllRecords('materialCosts')
      ]).then(function (r) {
        return { orders: r[0], investments: r[1], monthlyAllocations: r[2], materialCosts: r[3] };
      });
    },

    importAllData: function (data) {
      return Promise.all([
        clearStore('orders'),
        clearStore('investments'),
        clearStore('monthlyAllocations'),
        clearStore('materialCosts')
      ]).then(function () {
        var tasks = [];
        data.orders.forEach(function (r)             { tasks.push(putRecord('orders', r)); });
        data.investments.forEach(function (r)        { tasks.push(putRecord('investments', r)); });
        data.monthlyAllocations.forEach(function (r) { tasks.push(putRecord('monthlyAllocations', r)); });
        (data.materialCosts || []).forEach(function (r) { tasks.push(putRecord('materialCosts', r)); });
        return Promise.all(tasks);
      });
    }
  };
})();
