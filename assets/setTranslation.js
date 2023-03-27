(function () {
  'use strict';
  var DokuMe_SetTrans = function (backend) {
    this.backend = backend;

    this.appArr = [];
    this.catArr = [];
    this.objArr = [];

    this.jsKeys = [];

    if (DM_CORE_CONFIG.DO_AUTO_TRANSLATION && DM_CORE_CONFIG.DO_AUTO_TRANSLATION === true) {
      this.initAutoLang();
      console.log('please call transCls.autoLang(); in your app so it can be translated.');
    }
  };

  DokuMe_SetTrans.prototype.i18Return = function (cat, key, val) {
    var tranTxt = i18next.t(cat + '.' + key);

    if (DM_CORE_CONFIG.DO_AUTO_TRANSLATION && DM_CORE_CONFIG.DO_AUTO_TRANSLATION === true) {
      this.langJS(cat, key, val);
    }

    if (tranTxt.search(cat + ".") == -1) {
      return tranTxt;
    } else {
      this.jsKeys.push({
        key: cat + '.' + key,
        text: val
      });

      return val;
    }
  };

  DokuMe_SetTrans.prototype.initAutoLang = function () {
    var _ = this;

    _.appArr = [];
    _.catArr = [];

    _.backend.getObject(325, null, {}, function (data) {
      if (!util.errorHandler(data)) return !1;

      _.catArr = data.MESSAGE;

      _.backend.getObject(5, null, {}, function (data1) {
        if (!util.errorHandler(data1)) return !1;
        _.appArr = data1.MESSAGE;

        // autoLang should be called in the app itself because it is loaded later and elements are not available at this point
        //_.autoLang();
      }, { PROFILEID: DM_CORE_CONFIG.TRAN_PROFILE_ID });

    }, { PROFILEID: DM_CORE_CONFIG.TRAN_PROFILE_ID });
  };

  DokuMe_SetTrans.prototype.autoLang = function () {

    if (auth.config.id != 3) return false;

    var _ = this;
    var objArr = [];

    if (!this.appArr || !this.catArr) {
      setTimeout(function () {
        _.autoLang();
      }, 1000);
      return false;
    }

    const dataAttr = document.querySelectorAll('[data-i18n]');

    dataAttr.forEach(attr => {
      var val = attr.dataset.i18n;
      var txt = '';

      if (val.indexOf('[placeholder]') > -1) {
        txt = attr.placeholder;
        val = val.replace("[placeholder]", "");
      } else {
        txt = attr.innerHTML;
      }

      var itmArr = val.split('.');
      var isFound = objArr.find(function (value) {
        return value.WORD_KEY == itmArr[1];
      });

      if (!isFound) {
        var field = _.appArr ? _.appArr.find(function (value) {
          return value.LINK == itmArr[0];
        }) : null;

        if (field) {
          objArr.push({ "WORD_KEY": itmArr[1], "TRANSLATIONS": [{ "LANGUAGE": "en", "TRANSLATION": txt }], "APP_ID": field.ID, "CATEGORY_ID": null });
        } else {
          field = _.catArr ? _.catArr.find(function (value) {
            return value.CATEGORY_KEY == itmArr[0];
          }) : null;

          if (field) {
            objArr.push({ "WORD_KEY": itmArr[1], "TRANSLATIONS": [{ "LANGUAGE": "en", "TRANSLATION": txt }], "APP_ID": null, "CATEGORY_ID": field.ID });
          }
        }
      }

    });
    
    _.langUpdate(objArr);
  };

  DokuMe_SetTrans.prototype.langJS = function (tag, key, val) {
    var _ = this;

    if (!this.appArr) {
      setTimeout(function () {
        _.langJS(tag, key, val);
      }, 1000);
      return false;
    }

    var objArr = [];
    var field = this.appArr ? this.appArr.find(function (value) {
      return value.LINK == tag;
    }) : null;

    if (field) {
      objArr.push({ "WORD_KEY": key, "TRANSLATIONS": [{ "LANGUAGE": "en", "TRANSLATION": val }], "APP_ID": field.ID, "CATEGORY_ID": null });
    } else {
      field = this.catArr ? this.catArr.find(function (value) {
        return value.CATEGORY_KEY == tag;
      }) : null;

      if (field) {
        objArr.push({ "WORD_KEY": key, "TRANSLATIONS": [{ "LANGUAGE": "en", "TRANSLATION": val }], "APP_ID": null, "CATEGORY_ID": field.ID });
      }
    }

    if (objArr.length > 0) {
      this.langUpdate(objArr);
    }

  };

  DokuMe_SetTrans.prototype.langUpdate = function (objArr) {

    if (objArr.length < 1) {
      return false;
    }

    this.backend.replaceObject(326, objArr, ['WORD_KEY', 'APP_ID', 'CATEGORY_ID'], function (data) {
      if (!util.errorHandler(data, 1)) return true;
    }, {
      PROFILEID: DM_CORE_CONFIG.TRAN_PROFILE_ID
    });
  };

  DokuMe_SetTrans.prototype.initAutoSave = function () {
    var _ = this;

    // get translations
    this.backend.getObject(326, null, {

    }, function (data) {
      if (!util.errorHandler(data)) return false;

      _.getCategories(data.MESSAGE);
    }, {
      PROFILEID: DM_CORE_CONFIG.TRAN_PROFILE_ID
    });
  }

  DokuMe_SetTrans.prototype.getCategories = function (translationsJSON) {
    var _ = this;

    this.backend.getObject(325, null, {

    }, function (data) {
      if (!util.errorHandler(data)) return false;

      _.getApps(translationsJSON, data.MESSAGE);
    }, {
      PROFILEID: DM_CORE_CONFIG.TRAN_PROFILE_ID
    });
  }

  DokuMe_SetTrans.prototype.getApps = function (translationsJSON, categoriesJSON) {
    var _ = this;

    this.backend.getObject(5, null, {

    }, function (data) {
      if (!util.errorHandler(data)) return !1;

      _.findNewWords(translationsJSON, categoriesJSON, data.MESSAGE);
    }, {
      PROFILEID: DM_CORE_CONFIG.TRAN_PROFILE_ID
    });

  }

  DokuMe_SetTrans.prototype.findNewWords = function (translationsJSON, categoriesJSON, appsJSON) {

    var newTranslationKeys = [];
    var newCategoryWords = [];
    var newCategories = [];
    var newWords = [];

    const dataAttr = document.querySelectorAll('[data-i18n]');

    dataAttr.forEach(attr => {
      var i18nKEY = attr.dataset.i18n;
      var text = '';

      if (i18nKEY.indexOf('[placeholder]') > -1) {
        text = attr.placeholder;
        i18nKEY = i18nKEY.replace('[placeholder]', '');
      } else {
        text = attr.innerHTML;
      }

      this.jsKeys.push({
        key: i18nKEY,
        text: text
      });

    });

    console.log(this.jsKeys, 'jskeys');

    for (var idx in this.jsKeys) {

      var keyArray = this.jsKeys[idx].key.split('.');
      var category = categoriesJSON.find(a => a.CATEGORY_KEY == keyArray[0]);
      var app = appsJSON.find(a => a.LINK == keyArray[0]);

      if (app || category) {

        if (newTranslationKeys.includes(`${keyArray[0]}.${keyArray[1]}`)) continue;

        if (app) {
          var word = translationsJSON.find(a => a.APP_ID == app.ID && a.WORD_KEY == keyArray[1]);
        } else {
          var word = translationsJSON.find(a => a.CATEGORY_ID == category.ID && a.WORD_KEY == keyArray[1]);
        }

        if (word) continue;

        var langPrompt = prompt(`Welche Sprache ist es? \n\n${keyArray[0]}.${keyArray[1]}\n\n${this.jsKeys[idx].text}`);
        if (!langPrompt) continue;

        newTranslationKeys.push(`${keyArray[0]}.${keyArray[1]}`);

        newWords.push({
          BACKEND_ACTION: 'create',
          WORD_KEY: keyArray[1],
          TRANSLATIONS: [{
            LANGUAGE: langPrompt,
            TRANSLATION: this.jsKeys[idx].text
          }],
          APP_ID: app ? app.ID : null,
          CATEGORY_ID: category ? category.ID : null
        });

      } else {

        if (newTranslationKeys.includes(`${keyArray[0]}.${keyArray[1]}`)) continue;

        var langPrompt = prompt(`Welche Sprache ist es? \n\n${keyArray[0]}.${keyArray[1]}\n\n${this.jsKeys[idx].text}`);
        if (!langPrompt) continue;

        if (!newCategories.includes(keyArray[0])) {
          newCategories.push(keyArray[0]);
        }

        newTranslationKeys.push(`${keyArray[0]}.${keyArray[1]}`);

        newCategoryWords.push({
          BACKEND_ACTION: 'create',
          NEW_CATEGORY: keyArray[0],
          WORD_KEY: keyArray[1],
          TRANSLATIONS: [{
            LANGUAGE: langPrompt,
            TRANSLATION: this.jsKeys[idx].text
          }],
          APP_ID: null,
          CATEGORY_ID: null
        });
      }

    }

    this.saveNewCategoriesWords(newCategories, newCategoryWords);
    this.saveNewWords(newWords);
  }

  DokuMe_SetTrans.prototype.saveNewCategoriesWords = function (newCategories, newWords) {

    if (newCategories.length < 1) {
      return false;
    }

    var params = [];

    for (var idx in newCategories) {
      params.push({
        BACKEND_ACTION: 'create',
        ID_RESPONSE: newCategories[idx],
        CATEGORY_KEY: newCategories[idx]
      });
    }

    backend.patch(325, params, function (data) {
      if (!util.errorHandler(data, 1)) return false;

      for (var idx in data.MESSAGE) {
        if (data.MESSAGE[idx].SUCCESS !== true) {
          console.log('Category Save not successfull');
          continue;
        }

        var words = newWords.filter(a => a.NEW_CATEGORY == idx);
        if (words.length < 1) {
          console.log('No wordkeys found for category');
          continue;
        }

        for (var idx2 in words) {
          words[idx2].CATEGORY_ID = data.MESSAGE[idx].MESSAGE;
        }
      }

      // save wordkeys
      backend.patch(326, newWords, function (data2) {
        if (!util.errorHandler(data2, 1)) return false;

      }, 'object', {
        PROFILEID: DM_CORE_CONFIG.TRAN_PROFILE_ID
      });

    }, 'object', {
      PROFILEID: DM_CORE_CONFIG.TRAN_PROFILE_ID
    });
  }

  DokuMe_SetTrans.prototype.saveNewWords = function (newWords) {

    if (newWords.length < 1) return false;

    console.log({ newWords });

    this.backend.patch(326, newWords, function (data) {
      if (!util.errorHandler(data, 1)) return false;

    }, 'object', {
      PROFILEID: DM_CORE_CONFIG.TRAN_PROFILE_ID
    });

  }

  window.DokuMe_SetTrans = DokuMe_SetTrans;
})();
