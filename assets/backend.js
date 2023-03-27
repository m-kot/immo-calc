(function() {
  'use strict';

  var DokuMe_Backend = function(server, token, refreshOauthFN) {

    this.server = server;
    this.ACCESSID = null;
    this.PROFILEID = null;
    this.headers = null;
    this.accesstoken = token;
    this.timezone = null;
    this.refreshOauthFN = refreshOauthFN;

    this.failedRequests = [];

    // init headers
    this.setAccess();

    /*
     * dynamic prototyping
     *
     * if(typeof this.meinefunktion !== 'function') {
     DokuMe_Backend.prototype.meinefunktion = function() {
     //code
     }
     }*/
  };

  DokuMe_Backend.prototype.setAccesstoken = function(token) {
    this.accesstoken = token;
    this.setAccess(this.PROFILEID, this.ACCESSID);
  };

  DokuMe_Backend.prototype.setTimezone = function(setterTimezone) {
    if (!setterTimezone) return false;
    this.timezone = setterTimezone;
    this.setAccess(this.PROFILEID, this.ACCESSID);
  };

  // set headers for accessing profiles or groups
  DokuMe_Backend.prototype.setAccess = function(profileId, accessId) {
    if (profileId && accessId) {
      this.PROFILEID = profileId;
      if (profileId != accessId) {
        this.ACCESSID = accessId;
      } else {
        this.ACCESSID = null;
      }

      this.headers = {
        'X-DOKUME-ACCESSID': this.ACCESSID,
        'X-DOKUME-PROFILEID': this.PROFILEID,
        'Authorization': 'Bearer ' + this.accesstoken,
        'X-DOKUME-TIMEZONE': this.timezone
      };
    } else if (profileId) {
      this.PROFILEID = profileId;
      this.ACCESSID = null;

      this.headers = {
        'X-DOKUME-PROFILEID': this.PROFILEID,
        'Authorization': 'Bearer ' + this.accesstoken,
        'X-DOKUME-TIMEZONE': this.timezone
      };
    } else {
      this.ACCESSID = null;
      this.PROFILEID = null;

      this.headers = {
        'Authorization': 'Bearer ' + this.accesstoken,
        'X-DOKUME-TIMEZONE': this.timezone
      };
    }
  };

  DokuMe_Backend.prototype.getAuthHeader = function() {
    return {
      'Authorization': 'Bearer ' + this.accesstoken,
      'X-DOKUME-TIMEZONE': this.timezone
    };
  };

  DokuMe_Backend.prototype.prepareAuthHeader = function(data) {
    if (data && data === 1) {
      return this.getAuthHeader();

    } else if (data && (data.ACCESSID || data.PROFILEID)) {
      var tempHeader = this.getAuthHeader();

      if (data.ACCESSID && data.ACCESSID != data.PROFILEID) {
        tempHeader['X-DOKUME-ACCESSID'] = data.ACCESSID;
      }

      if (data.PROFILEID) {
        tempHeader['X-DOKUME-PROFILEID'] = data.PROFILEID;
      }

      return tempHeader;

    } else if (data && !isNaN(data)) {

      return {
        'Authorization': 'Bearer ' + this.accesstoken,
        'X-DOKUME-PROFILEID': data,
        'X-DOKUME-TIMEZONE': this.timezone
      };

    } else {
      //console.log(_.headers);
      return this.headers;
    }

  };

  DokuMe_Backend.prototype.get = function(fnName, params, callback, type, headerOff) {
    if (!fnName) return false;
    if (!type) {
      type = 'object';
    }

    var _ = this;

    params = _.prepareParams(params);

    headerOff = this.prepareAuthHeader(headerOff);
    _.executeRequest(this.server + 'protected.php/' + type + '/' + fnName + '?' + new URLSearchParams(params), {
      method: 'GET',
      headers: headerOff
    }, callback, 'get');
  };

  /*
   * get data from an object
   * params: {
     include_data: 1,
     shared: true,
     references: true,
     custom: custom function on server
      where: JSON.stringify(forid = 1)
      {key:"APP_KEY",operator:"is",value:"4163"}
      Operatoren:
      is, isnot, lower, higher
   * }
   */
  DokuMe_Backend.prototype.getObject = function(object, instance, params, callback, headerOff) {
    if (!object) return false;

    var _ = this;

    params = _.prepareParams(params);

    instance = instance ? '/' + instance : '';
    /*$.get(this.server + 'protected.php/object/' + object + instance, params, function (data) {
        if(data.SUCCESS === true) {
            _.executeCallback(callback, data, "getObject");
        }
    });*/
    headerOff = this.prepareAuthHeader(headerOff);

    _.executeRequest(this.server + 'protected.php/object/' + object + instance + '?' + new URLSearchParams(params), {
      method: 'GET',
      headers: headerOff
    }, callback, 'getObject');
  };

  DokuMe_Backend.prototype.getObjectAttachements = function(object, instance, params, callback, headerOff) {
    if (!object) return false;

    var _ = this;

    instance = instance ? '/' + instance : '';
    headerOff = this.prepareAuthHeader(headerOff);

    _.executeRequest(this.server + 'protected.php/object/attachements/' + object + instance + '?' + new URLSearchParams(params), {
      method: 'GET',
      headers: headerOff
    }, callback, 'getObjectAttachement');
  };

  DokuMe_Backend.prototype.getFunction = function(fnName, params, callback, headerOff) {
    if (!fnName) return false;

    var _ = this;

    params = _.prepareParams(params);

    headerOff = this.prepareAuthHeader(headerOff);

    _.executeRequest(this.server + 'functions.php/' + fnName + '?' + new URLSearchParams(params), {
      method: 'GET',
      headers: headerOff
    }, callback, 'getFunction');
  };

  DokuMe_Backend.prototype.save = function(fnName, json, callback, type, headerOff) {
    //fnName, params, callback, type, headerOff

    if (!fnName) return false;
    if (!type) {
      type = 'object';
    }

    var _ = this;

    headerOff = this.prepareAuthHeader(headerOff);

    //headerOff['Content-Type'] = 'application/json;charset=UTF-8';

    _.executeRequest(this.server + 'protected.php/' + type + '/' + fnName, {
      method: 'POST',
      body: JSON.stringify(json),
      headers: headerOff
    }, callback, 'save');
  };

  DokuMe_Backend.prototype.multi = function(json, callback, type, headerOff) {
    this.save('multi', json, callback, type, headerOff);
  };

  DokuMe_Backend.prototype.saveFunction = function(fnName, json, callback, headerOff) {
    if (!fnName) return false;
    var _ = this;

    headerOff = this.prepareAuthHeader(headerOff);

    headerOff['Content-Type'] = 'application/json;charset=UTF-8';

    _.executeRequest(this.server + 'functions.php/' + fnName, {
      method: 'POST',
      body: JSON.stringify(json),
      headers: headerOff
    }, callback, 'saveFunction');
  };

  DokuMe_Backend.prototype.saveObject = function(objectId, instanceId, json, callback, specialHeaders) {
    if (!objectId || !json) {
      console.warn('Object ID is not defined. Can\'t save object');
      return false;
    }
    //make update
    if (instanceId) objectId += '/' + instanceId;
    var _ = this;

    specialHeaders = this.prepareAuthHeader(specialHeaders);

    //specialHeaders['Content-Type'] = 'application/json;charset=UTF-8';

    _.executeRequest(this.server + 'protected.php/object/' + objectId, {
      method: 'POST',
      body: JSON.stringify(json),
      headers: specialHeaders
    }, callback, 'saveObject');
  };

  DokuMe_Backend.prototype.patch = function(objectId, json, callback, type, headerOff) {
    if (!objectId || !json) {
      console.warn('Object ID is not defined. Can\'t save object');
      return false;
    }

    if (!type) {
      type = 'object';
    }

    var _ = this;

    headerOff = this.prepareAuthHeader(headerOff);

    _.executeRequest(this.server + 'protected.php/' + type + '/' + objectId, {
      method: 'PATCH',
      body: JSON.stringify(json),
      headers: headerOff
    }, callback, 'patch');
  };

  DokuMe_Backend.prototype.delete = function(fnName, callback, type) {
    if (!fnName) return false;
    if (!type) {
      type = 'object';
    }

    var _ = this;

    _.executeRequest(this.server + 'protected.php/' + type + '/' + fnName, {
      method: 'DELETE',
      headers: _.headers
    }, callback, 'delete');
  };

  DokuMe_Backend.prototype.deleteObject = function(objectId, instanceId, callback, headerOff) {
    if (!objectId || !instanceId) return false;
    var _ = this;

    var url = this.server + 'protected.php/object/' + objectId + '/' + instanceId;

    var json = null;

    headerOff = this.prepareAuthHeader(headerOff);

    if (Array.isArray(instanceId)) {
      url = this.server + 'protected.php/object/' + objectId;
      json = instanceId;
    }

    _.executeRequest(url, {
      method: 'DELETE',
      body: JSON.stringify(json),
      headers: headerOff
    }, callback, 'deleteObject');
  };

  DokuMe_Backend.prototype.deleteFunction = function(fnName, instanceId, callback, headerOff) {
    if (!fnName || !instanceId) return false;
    var _ = this;

    headerOff = this.prepareAuthHeader(headerOff);

    _.executeRequest(this.server + 'functions.php/' + fnName + '/' + instanceId, {
      method: 'DELETE',
      headers: headerOff
    }, callback, 'deleteFunction');
  };

  DokuMe_Backend.prototype.replaceObject = function(objectId, json, keyfields, callback, headerOff) {
    if (!objectId || !keyfields || !json) {
      console.warn('Object ID is not defined. Can\'t save object');
      return false;
    }

    var _ = this;

    headerOff = this.prepareAuthHeader(headerOff);

    _.executeRequest(this.server + 'protected.php/object/' + objectId + '/' + JSON.stringify(keyfields), {
      method: 'PUT',
      body: JSON.stringify(json),
      headers: headerOff
    }, callback, 'replaceObject');
  };

  DokuMe_Backend.prototype.createAttachement = function(objectId, instanceId, attachedObject, attachedID, callback) {
    if (!objectId || !instanceId || !attachedID || !attachedObject) {
      console.warn('IDs are not set correctly.');
      return false;
    }

    var _ = this;

    _.executeRequest(this.server + 'protected.php/object/66', {
      method: 'POST',
      body: JSON.stringify({
        INSTANCE_ID: instanceId,
        INSTANCE_OBJECT_ID: objectId,
        ATTACHED_ID: attachedID,
        ATTACHED_OBJECT_ID: attachedObject
      }),
      headers: _.headers
    }, callback, 'createAttachement');
  };

  DokuMe_Backend.prototype.prepareParams = function (params) {

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

  DokuMe_Backend.prototype.executeRequest = function(url, options, callback, method) {
    var _ = this;

    fetch(url, options)
    .then(function(response) {
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
    .then(function(data) {
      
      if (data.SUCCESS === false && data.MESSAGE === 'OAuth verification failed') {
        console.log('oAuth error done - i will retry the request');

        _.failedRequests.push({
          url: url,
          options: options,
          callback: callback,
          method: _.getObject
        });

        if (_.refreshOauthFN) { // && options.url !== 'https://dokume.net/backend/src/protected.php/general/init'
          _.refreshOauthFN(true);

          // dont do the callback, because we will retry the request after getting a new token
          return false;
        }

        // dont do the callback, because we will retry the request after getting a new token
        return false;
      }

      _.executeCallback(callback, data, method);
    }).catch(function(data) {
      _.failedRequestHandler(data, url, options, callback);
    })
  };
  
  DokuMe_Backend.prototype.failedRequestHandler = function(data, url, options, callback) {
    console.trace(data);

    try {
      data = JSON.parse(data.responseText);

      if (data.SUCCESS === false && data.MESSAGE === 'OAuth verification failed') {
        console.log('oAuth error fail');

        this.failedRequests.push({
          url: url,
          options: options,
          callback: callback,
          method: this.getObject
        });

        if (this.refreshOauthFN) {
          this.refreshOauthFN(true);
        }
      }
    } catch (err) {
      //return false;
      console.log(err);
    }
  };

  DokuMe_Backend.prototype.retryRequests = function() {
    var _ = this;

    for (var idx in _.failedRequests) {
      //set new accesstoken because in option we still have the old accesstoken
      _.failedRequests[idx].options.headers['Authorization'] = 'Bearer ' + _.accesstoken;

      _.executeRequest(_.failedRequests[idx].url, _.failedRequests[idx].options, _.failedRequests[idx].callback, _.failedRequests[idx].method);
    }

    _.failedRequests = [];
  };

  /*
   * check if callback is defined, else console info
   */
  DokuMe_Backend.prototype.executeCallback = function(callback, data, name) {
    if (typeof callback === 'function') {
      callback(data);
    } else {
      console.info("Define callback for " + name);
    }
  };

  //expose FileStorage to window
  window.DokuMe_Backend = DokuMe_Backend;
})();
