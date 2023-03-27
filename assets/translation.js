var DokuMe_Translation = (function() {

  i18next.init({
    lng: 'de'
  }, function(err, t) {
    i18nextJquery.init(i18next, $, {
      handleName: 'i18n'
    });
    $('body').i18n();
  });

  var lng = localStorage.getItem('language');
  setLng(lng);

  function loadLocales(saveLng, callback) {
    // do check if lng changed - if not no need to refetch data
    if (backend && subdomain != 127) {

      if (subdomain && subdomain == 'fil') {
        backend.get('multiple/' + lng, {
          ids: '[13199, 14784, 32626]'
        }, function(data) {
          doTranslation(data, saveLng, callback)
        }, 'translation');
      } else {
        backend.getFunction('translation/' + lng, null, function(data) {
          doTranslation(data, saveLng, callback);
        });
      }
    } else {
      fetch(`${subdomain && subdomain == 127 ? 'https://api.dokume.net' : DM_CORE_CONFIG.BACKEND_URL}/functions.php/translation/${DM_CORE_CONFIG.LANGUAGE}?include_data=true`)
      .then(response => response.json())
      .then(data => doTranslation(data, saveLng, callback));
    }
  }

  function getLanguage() {
    return lng;
  }

  function doTranslation(locale, saveLng, callback) {
    i18next.init({
      lng: 'de',
      whitelist: ['en', 'de'],
      /*backend: {
          loadPath: 'locales/{{lng}}/translation.json',
          //parse: function(data) { return data.replace(/a/g, '');console.log('hi'); },
          //ajax: loadLocales
      },*/
      resources: {
        de: {
          translation: locale
        }
      }
    }, function(err, t) {
      i18nextJquery.init(i18next, $, {
        handleName: 'i18n'
      });
      $('body').i18n();
    });

    if (callback) {
      callback();
    }

    if (saveLng !== false) {
      DokuMe_Translation.saveLng();
    }
  }

  function saveLng() {
    if (!backend) return false;

    backend.saveObject(2, auth.config.id, {
      LANGUAGE: lng
    }, console.log);
  }

  function setLng(language) {

    switch (language) {
      case 'de':
      case 'DE':
        lng = 'DE';
        break;
      case 'en':
      case 'EN':
        lng = 'EN';
        break;
      case 'pl':
      case 'PL':
        lng = 'PL';
        break;
      case 'el':
      case 'EL':
        lng = 'EL';
        break;
      case 'es':
      case 'ES':
        lng = 'ES';
        break;
      case 'fr':
      case 'FR':
        lng = 'FR';
        break;
      case 'jp':
      case 'JP':
        lng = 'JP';
        break;
      default:
        lng = 'DE';
        break;
    }
    if (!lng) {
      lng = 'DE';
    }
    localStorage.setItem('language', lng);

    if (typeof moment != undefined) {
      moment.locale(lng.toLowerCase());
    }
  }

  function i18n(category, key, value) {
    var tranTxt = i18next.t(category + '.' + key);

    if (tranTxt.search(category + '.') == -1) {
      return tranTxt;
    } else {
      return value;
    }
  }

  return {
    getLanguage: getLanguage,
    setLng: setLng,
    loadLocales: loadLocales,
    saveLng: saveLng,
    i18n: i18n
  }
})();
