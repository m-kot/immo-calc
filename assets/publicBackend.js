(function () {
  "use strict";

  var DokuMe_PublicBackend = function (server, apikey, profileID) {

    this.server = server;
    this.apikey = apikey;
    this.profileId = profileID;

    /*
     * dynamic prototyping
     *
     * if(typeof this.meinefunktion !== 'function') {
     DokuMe_PublicBackend.prototype.meinefunktion = function() {
     //code
     }
     }*/
  };

  /*
   * get data from an object
   * params: {
     include_data: 1,
     shared: true,
     references: true,
     custom: custom function on server
      where: JSON.stringify(forid = 1)
   * }
   */

  DokuMe_PublicBackend.prototype.get = function (fnName, params, callback, type) {
    if (!fnName) return false;
    if (!type) {
      type = 'object';
    }

    var _ = this;

    params = _.prepareParams(params);

    _.executeRequest(this.server + '/public.php/' + type + '/' + fnName + '?' + new URLSearchParams(params), {
      method: 'GET',
    }, callback, 'get');
  };

  DokuMe_PublicBackend.prototype.getObject = function (object, instance, params, callback) {
    if (!object) return false;

    var _ = this;

    params = _.prepareParams(params);

    instance = instance ? '/' + instance : '';
    
    _.executeRequest(this.server + '/public.php/object/' + object + instance + '?' + new URLSearchParams(params), {
      method: 'GET',
    }, callback, 'getObject');
  };

  DokuMe_PublicBackend.prototype.getObjectAttachements = function (object, instance, params, callback) {
    if (!object) return false;

    var _ = this;

    params = _.prepareParams(params);

    instance = instance ? '/' + instance : '';

    _.executeRequest(this.server + '/protected.php/object/attachements/' + object + instance + '?' + new URLSearchParams(params), {
      method: 'GET',
    }, callback, 'getObjectAttachement');
  };

  DokuMe_PublicBackend.prototype.getFunction = function (fnName, params, callback) {
    if (!fnName) return false;
    var _ = this;

    params = _.prepareParams(params);

    _.executeRequest(this.server + '/functions.php/' + fnName + '?' + new URLSearchParams(params), {
      method: 'GET'
    }, callback, 'getFunction');
  };

  DokuMe_PublicBackend.prototype.save = function (fnName, json, callback, type) {

    if (!fnName) return false;
    if (!type) {
      type = 'object';
    }

    var _ = this;

    _.executeRequest(this.server + '/public.php/' + type + '/' + fnName, {
      method: 'POST',
      body: JSON.stringify(json)
    }, callback, 'save');
  };

  DokuMe_PublicBackend.prototype.multi = function(json, callback, type) {
    this.save('multi', json, callback, type);
  };

  DokuMe_PublicBackend.prototype.saveFunction = function(fnName, json, callback) {
    if (!fnName) return false;
    var _ = this;

    var headerOff = this.prepareAuthHeader(headerOff);

    var specialHeaders = {
      'Content-Type': 'application/json;charset=UTF-8'
    };

    _.executeRequest(this.server + '/functions.php/' + fnName, {
      method: 'POST',
      body: JSON.stringify(json),
      headers: specialHeaders
    }, callback, 'saveFunction');
  };

  DokuMe_PublicBackend.prototype.saveObject = function (objectId, instanceId, json, callback) {
    if (!objectId || !json) {
      console.warn('Object ID is not defined. Can\'t save object');
      return false;
    }
    //make update
    if (instanceId) objectId += '/' + instanceId;
    var _ = this;

    _.executeRequest(this.server + '/public.php/object/' + objectId, {
      method: 'POST',
      body: JSON.stringify(json)
    }, callback, 'saveObject');
  };

  DokuMe_PublicBackend.prototype.patch = function (objectId, json, callback, type) {
    if (!objectId || !json) {
      console.warn('Object ID is not defined. Can\'t save object');
      return false;
    }

    if (!type) {
      type = 'object';
    }

    var _ = this;

    _.executeRequest(this.server + '/public.php/' + type + '/' + objectId, {
      method: 'PATCH',
      body: JSON.stringify(json)
    }, callback, 'patch');
  };

  DokuMe_PublicBackend.prototype.delete = function (fnName, callback, type) {
    if (!fnName) return false;
    if (!type) {
      type = 'object';
    }

    var _ = this;

    _.executeRequest(this.server + '/public.php/' + type + '/' + fnName, {
      method: 'DELETE'
    }, callback, 'delete');
  };

  DokuMe_PublicBackend.prototype.deleteObject = function (objectId, instanceId, callback) {
    if (!objectId || !instanceId) return false;
    var _ = this;

    var url = this.server + '/public.php/object/' + objectId + '/' + instanceId;

    var json = null;

    if (Array.isArray(instanceId)) {
      url = this.server + 'protected.php/object/' + objectId;
      json = instanceId;
    }

    _.executeRequest(url, {
      method: 'DELETE',
      body: JSON.stringify(json)
    }, callback, 'deleteObject');
  };

  DokuMe_PublicBackend.prototype.deleteFunction = function(fnName, instanceId, callback) {
    if (!fnName || !instanceId) return false;
    var _ = this;

    _.executeRequest(this.server + '/functions.php/' + fnName + '/' + instanceId, {
      method: 'DELETE'
    }, callback, 'deleteFunction');
  };

  DokuMe_PublicBackend.prototype.replaceObject = function (objectId, json, keyfields, callback) {
    if (!objectId || !keyfields || !json) {
      console.warn('Object ID is not defined. Can\'t save object');
      return false;
    }

    var _ = this;

    _.executeRequest(this.server + '/public.php/object/' + objectId + '/' + JSON.stringify(keyfields), {
      method: 'PUT',
      body: JSON.stringify(json)
    }, callback, 'replaceObject');
  };

  DokuMe_PublicBackend.prototype.createAttachement = function (objectId, instanceId, attachedObject, attachedID, callback) {
    if (!objectId || !instanceId || !attachedID || !attachedObject) {
      console.warn('IDs are not set correctly.');
      return false;
    }

    var _ = this;

    _.executeRequest(this.server + '/public.php/object/66', {
      method: 'POST',
      body: JSON.stringify({
        INSTANCE_ID: instanceId,
        INSTANCE_OBJECT_ID: objectId,
        ATTACHED_ID: attachedID,
        ATTACHED_OBJECT_ID: attachedObject
      })
    }, callback, 'createAttachement');
  };

  DokuMe_PublicBackend.prototype.prepareParams = function (params) {

    if (params && params.where && typeof params.where === 'object') {
      params.where = JSON.stringify(params.where);
    }

    if (!params) {
      params = {
        include_data: true
      };
    }

    if (params.include_data === undefined) {
      params.include_data = true;
    }

    if (params && params.references && typeof params.references === 'object') {
      params.references = JSON.stringify(params.references);
    }

    if (params && params.limit && typeof params.limit === 'object') {
      params.limit = JSON.stringify(params.limit);
    }

    if (params && params.fields && typeof params.fields === 'object') {
      params.fields = JSON.stringify(params.fields);
    }

    if (params && params.shared && typeof params.shared === 'object') {
      //params.shared = JSON.stringify(params.shared);
      if (typeof params.shared.grouped != 'undefined') {
        params['shared[grouped]'] = params.shared.grouped;
      } 
      
      if (typeof params.shared.type != 'undefined') {
        params['shared[type]'] = params.shared.type;
      }
      
      if (typeof params.shared.grouped != 'undefined' || typeof params.shared.type != 'undefined') {
        params.shared = null;
      }
    }

    return params;
  };

  DokuMe_PublicBackend.prototype.executeRequest = function (url, options, callback, method) {
    var _ = this;

    if (!options.headers) {
      options.headers = {};
    }

    options.headers['X-DOKUME-API-KEY'] = _.apikey;

    if (_.profileId) {
      options.headers['X-DOKUME-PROFILEID'] = _.profileId;
    }

    fetch(url, options)
      .then(function (response) {
        if (response.headers.get('Content-Type').includes('json')) {
          return response.json();
        } else if (response.headers.get('Content-Type').includes('openxmlformats')) {
          return response.blob();
        } else if (response.headers.get('Content-Type').includes('xml')) {
          return response.text();
        } else {
          return response.blob();
        }
      })
      .then(function (data) {

        _.executeCallback(callback, data, method);

      }).catch(function (data) {
        _.failedRequestHandler(data, url, options, callback);
      })
  };

  DokuMe_PublicBackend.prototype.failedRequestHandler = function(data, url, options, callback) {
    console.trace(data);
    
    try {
      data = JSON.parse(data.responseText);

      if (data.SUCCESS === false && data.MESSAGE === 'OAuth verification failed') {
        console.log('oAuth error fail');
      }
    } catch (err) {
      //return false;
      console.log(err);
    }
  };

  /*
   * check if callback is defined, else console info
   */
  DokuMe_PublicBackend.prototype.executeCallback = function (callback, data, name) {
    if (typeof callback === 'function') {
      callback(data);
    } else {
      console.info("Define callback for " + name);
    }
  };

  //expose FileStorage to window
  window.DokuMe_PublicBackend = DokuMe_PublicBackend;
})();
