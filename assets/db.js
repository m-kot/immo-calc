'use strict';
class idbApp {
  constructor() {
    if (!('indexedDB' in window)) {
      console.log('This browser doesn\'t support IndexedDB');
      return;
    }
    this.dbPromise = idb.open('dokume-chat', 1, function(upgradeDb) {
      console.log(upgradeDb.oldVersion)
      switch (upgradeDb.oldVersion) {
        case 0:
          var room = upgradeDb.createObjectStore('room', {
            keyPath: 'local_id'
          });
          room.createIndex('id', 'id');
          var message = upgradeDb.createObjectStore('message', {
            keyPath: 'local_id'
          });
          message.createIndex('id', 'id');
          message.createIndex('chat_id', 'chat_id');
          break
      }
    });
  }
  addObject(objName, objItem) {
    return this.dbPromise.then(function(db) {
      var tx = db.transaction(objName, 'readwrite');
      var store = tx.objectStore(objName);
      return Promise.all(objItem.map(function(item) {
        return store.add(item);
      })).catch(function(e) {
        tx.abort();
        console.log(e);
      });
    });
  }
  getAllItem(objName) {
    try {
      return this.dbPromise.then(function(db) {
        var tx = db.transaction(objName, 'readonly');
        var store = tx.objectStore(objName);
        return store.getAll();
      });
    } catch (err) {
      console.log(err);
    }
  }
  getByItemId(objName, key, id) {
    return this.dbPromise.then(function(db) {
      var tx = db.transaction(objName, 'readonly');
      var store = tx.objectStore(objName);
      if (typeof id !== 'undefined' && id != '') {
        var index = store.index(id);
        return index.getAll(key);
      } else
        return store.getAll(key);
    });
  }
  updateObjectByKey(objName, objItem) {
    return this.dbPromise.then(function(db) {
      var tx = db.transaction(objName, 'readwrite');
      var store = tx.objectStore(objName);
      var requestUpdate = store.put(objItem);
      requestUpdate.onerror = function(event) {
        console.log('got error on update');
      };
      requestUpdate.onsuccess = function(event) {
        console.log('update success');
      };
    });
  }
  deleteObjectByKey(objName, key, id) {
    var __ = this;
    __.getByItemId(objName, key, id).then(function(item) {
      __.dbPromise.then(function(db) {
        var tx = db.transaction(objName, 'readwrite');
        var store = tx.objectStore(objName);
        for (var idx in item) {
          store.delete(item[idx].local_id);
        }
      });
    });
  }
};
