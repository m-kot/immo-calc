var util = (function() {

  var showFeedback = showAlert;

  function errorHandler(data, showSuccess, continueFN) {

    if (data.SUCCESS === true || data.SUCCESS === 'true') {
      if (showSuccess) {
        var text = '';
        switch (showSuccess) {
          case 1:
            text = i18next.t('notification.succesfullySaved');
            break;
          case 2:
            text = i18next.t('notification.sucessfullyDeleted');
            break;
        }

        showFeedback(1, text);
      }
      return true;
    } else if (data.MESSAGE) {
      var text = '';
      var callback = null;
      if (typeof data.MESSAGE !== 'object' && typeof data.MESSAGE === 'string' && !data.MESSAGE.includes('Slim')) {
        if (data.MESSAGE.includes('.')) {
          text = i18next.t(data.MESSAGE);
        } else {
          text = i18next.t('notification.' + data.MESSAGE);
        }
        text = text.replace('notification.', '');
      } else {
        text = 'Ein Fehler ist aufgetreten. Wende dich bitte an das Supportteam: <a href="#/help">Hilfe anfordern</a>';
        callback = function() {
          window.location = '#/help/index/' + page_name;
        }
      }

      showFeedback(0, text, callback);

      return false;
    } else {
      text = 'Ein Fehler ist aufgetreten. Wende dich bitte an das Supportteam: <a href="#/help">Hilfe anfordern</a>';
      callback = function callback() {
        window.location = '#/help/index/' + page_name;
      };

      showFeedback(0, text, callback);

      return false;
    }

    if (!continueFN) {
      return false;
    }
  }

  function showAlert(type, text, callback) {
    alert(text);
  }

  function setShowFeedback(fkt) {
    showFeedback = fkt;
  }

  /*
    util.loadJS('yourcode.js', yourCodeToBeCalled, document.body);
  */
  function loadJS(url, implementationCode, location) {
    //url is URL of external file, implementationCode is the code
    //to be called from the file, location is the location to
    //insert the <script> element

    var scriptTag = document.createElement('script');
    scriptTag.src = url;

    scriptTag.onload = implementationCode;
    scriptTag.onreadystatechange = implementationCode;

    location.appendChild(scriptTag);
  };

  return {
    errorHandler: errorHandler,
    setShowFeedback: setShowFeedback,
    loadJS: loadJS
  };

})();
