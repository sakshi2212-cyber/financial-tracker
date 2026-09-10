// db.js — IndexedDB setup and all database operations
//
// Why the module pattern (var AppDB = function(){ ... }())?
// It keeps internal variables (_db, open, etc.) private. Only the
// functions listed in the final `return` block are accessible outside.

var AppDB = (function () {
  var DB_NAME = 'sticker-tracker';
  var DB_VERSION = 1;
  var _db = null;

  // Opens the database connection. If already open, returns it immediately.
  // Creates the object stores (like tables) the first time the app ever runs.
  function open() {
    return new Promise(function (resolve, reject) {
      if (_db) { resolve(_db); return; }

      var request = indexedDB.open(DB_NAME, DB_VERSION);

      // onupgradeneeded fires when the database is created for the first time,
      // or when DB_VERSION is bumped. This is where we define the schema.
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
          // monthKey is a string like "2026-09" — unique per month, used as the key
          db.createObjectStore('monthlyAllocations', { keyPath: 'monthKey' });
        }
      };

      request.onsuccess = function (event) {
        _db = event.target.result;
        resolve(_db);
      };

      request.onerror = function (event) {
        reject(event.target.error);
      };
    });
  }

  function addRecord(storeName, record) {
    return open().then(function (db) {
      return new Promise(function (resolve, reject) {
        var tx = db.transaction(storeName, 'readwrite');
        var req = tx.objectStore(storeName).add(record);
        req.onsuccess = function () { resolve(req.result); };
        req.onerror = function () { reject(req.error); };
      });
    });
  }

  function putRecord(storeName, record) {
    return open().then(function (db) {
      return new Promise(function (resolve, reject) {
        var tx = db.transaction(storeName, 'readwrite');
        var req = tx.objectStore(storeName).put(record);
        req.onsuccess = function () { resolve(req.result); };
        req.onerror = function () { reject(req.error); };
      });
    });
  }

  function getAllRecords(storeName) {
    return open().then(function (db) {
      return new Promise(function (resolve, reject) {
        var tx = db.transaction(storeName, 'readonly');
        var req = tx.objectStore(storeName).getAll();
        req.onsuccess = function () { resolve(req.result); };
        req.onerror = function () { reject(req.error); };
      });
    });
  }

  function getRecord(storeName, key) {
    return open().then(function (db) {
      return new Promise(function (resolve, reject) {
        var tx = db.transaction(storeName, 'readonly');
        var req = tx.objectStore(storeName).get(key);
        req.onsuccess = function () { resolve(req.result || null); };
        req.onerror = function () { reject(req.error); };
      });
    });
  }

  function clearStore(storeName) {
    return open().then(function (db) {
      return new Promise(function (resolve, reject) {
        var tx = db.transaction(storeName, 'readwrite');
        var req = tx.objectStore(storeName).clear();
        req.onsuccess = function () { resolve(); };
        req.onerror = function () { reject(req.error); };
      });
    });
  }

  return {
    addOrder:        function (o) { return addRecord('orders', o); },
    getOrders:       function () { return getAllRecords('orders'); },
    addInvestment:   function (i) { return addRecord('investments', i); },
    getInvestments:  function () { return getAllRecords('investments'); },
    saveAllocation:  function (a) { return putRecord('monthlyAllocations', a); },
    getAllocation:    function (monthKey) { return getRecord('monthlyAllocations', monthKey); },

    getAllData: function () {
      return Promise.all([
        getAllRecords('orders'),
        getAllRecords('investments'),
        getAllRecords('monthlyAllocations')
      ]).then(function (results) {
        return { orders: results[0], investments: results[1], monthlyAllocations: results[2] };
      });
    },

    importAllData: function (data) {
      return Promise.all([
        clearStore('orders'),
        clearStore('investments'),
        clearStore('monthlyAllocations')
      ]).then(function () {
        var tasks = [];
        data.orders.forEach(function (r) { tasks.push(putRecord('orders', r)); });
        data.investments.forEach(function (r) { tasks.push(putRecord('investments', r)); });
        data.monthlyAllocations.forEach(function (r) { tasks.push(putRecord('monthlyAllocations', r)); });
        return Promise.all(tasks);
      });
    }
  };
})();
