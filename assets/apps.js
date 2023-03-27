'use strict';

var DM_APPS = (function () {

  var installedApps = null;

  function getApps(callback, profileOnly) {
    backend.get('apps', null, function (data) {
      if (data.SUCCESS !== true) return false;
      /*data.MESSAGE = data.MESSAGE.sort(function(a, b) {
        return a.APPS_ID.NAME001 > b.APPS_ID.NAME001;
      });*/

      installedApps = data.MESSAGE;
      DM_PUBSUB.emit('getInstalledApps', installedApps);

      if (typeof callback === 'function') {
        // if access_id dont show a profile only menu because it will overwrite the access menu
        if (access_id && profileOnly) return false;

        callback(data.MESSAGE);
      }
      
    }, 'general', 1);
  }

  function getMenuLink(callback) {
    backend.getObject(314, null, {
      shared: true
    }, function (data) {
      if (!util.errorHandler(data)) return false;
      
      if (typeof callback === 'function') {
        callback(data);
      }
    });
  }

  function findAppByURL(url) {
    return installedApps.find(a => a.LINK == url);
  }

  function getInstalledApps() {
    return installedApps;
  }

  function reset() {
    installedApps = null;
  }

  return { getApps, getInstalledApps, getMenuLink, reset, findAppByURL }
})();