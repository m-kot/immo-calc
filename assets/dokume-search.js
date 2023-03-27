/*
 *
 * we need jQuery for ajax get request
 * {
 element: "#searchTEST",
 trigger: ".dokume-search",
 placeholder: "Unternehmen Suchen",
 resultID: "#companyId",
 successHandler: function() {alert("success");},
 errorHandler: function() {alert("error");},
 errorText: ""
 }*/

(function() {
  'use strict';

  var SearchBox = function(config, callback) {
    var _ = this;
    this.config = config;
    if (this.config.searchGroupId) {
      this.config.url = 'search/group/' + this.config.searchGroupId;
    } else if (this.config.categoryId) {
      this.config.url = 'search/category/' + this.config.categoryId;      
    } else {
      this.config.url = 'search';
    }
    this.backend = this.config.backend ? this.config.backend : backend;
    this.parent = elq(config.element);
    this.searchclose = this.guid();
    this.search = this.guid();
    this.searchvalue = config.resultID;
    this.searchresults = this.guid();
    this.lastUserSearch = [];

    if (localStorage.getItem('lastUserSearch')) {
      this.lastUserSearch = JSON.parse(localStorage.getItem('lastUserSearch'));
    }

    this.parent.innerHTML = `
      <div class="dokume-searchheader">
          <div id="${this.searchclose}" class="dokumesearch-close">
            <i class="fas fa-arrow-left"></i>
          </div>

          <input type="search" id="${this.search}" class="dokume-search form-control" data-i18n="[placeholder]${config.placeholder}" placeholder="&#128269; ${config.placeholder}" autocomplete="off">
      </div>

      <input class="dokume-searchvalue" type="hidden" id="${config.resultID}" name="${config.resultID}">

      <div id="${this.searchresults}" class="dokume-searchresults" tabindex="1"></div>
    `;

    //save all elements so we can use them later
    this.searchclose = el(this.searchclose);
    this.search = el(this.search);
    this.searchvalue = el(this.searchvalue);
    this.searchresults = el(this.searchresults);

    //close fullscreen search, clear results, clear search value on small devices
    this.searchclose.addEventListener('click', function() {
      _.search.value = '';
      _.searchresults.innerHTML = '';
      _.parent.classList.remove('dokume-fullscreen');
      if (_.config.closeHandler) {
        _.config.closeHandler();
      }
    });

    this.search.addEventListener('click', function() {
      _.parent.classList.add('dokume-fullscreen');
      if (_.lastUserSearch.length > 0) {
        _.showSearchResults({
          SUCCESS: true,
          MESSAGE: _.lastUserSearch
        }, _.search.value);
      }
    });

    if (config.trigger !== '.dokume-search') {
      elq(config.trigger).addEventListener('click', function() {
        _.parent.classList.add('dokume-fullscreen');
        if (_.lastUserSearch.length > 0) {
          _.showSearchResults({
            SUCCESS: true,
            MESSAGE: _.lastUserSearch
          }, _.search.value);
        }
      });
    }

    var x;
    this.search.addEventListener('keyup', function(e) {
      if ([38, 40, 13].includes(e.keyCode)) {

        var activeClass = 'search__result--active';
        var current = _.parent.querySelector(`.${activeClass}`);
        var items = _.parent.querySelectorAll('.media');
        var next;

        if (e.keyCode === 40 && current) {
          next = current.nextElementSibling || items[0];
        } else if (e.keyCode === 40) {
          next = items[0];
        } else if (e.keyCode === 38 && current) {
          next = current.previousElementSibling || items[items.length - 1];
        } else if (e.keyCode === 38) {
          next = items[items.length - 1];
        } else if (e.keyCode === 13) {
          _.resultClick(current);
        }

        if (current) {
          current.classList.remove(activeClass);
        }
        if (next) {
          next.classList.add(activeClass);
        }

      } else if (_.search.value != '') {
        _.searchvalue.value = '';
        var s = _.search.value;

        setTimeout(function() {
          if (_.search.value == s) { // Check the value searched is the latest one or not. This will help in making the ajax call work when client stops writing.
            if (x) {
              x.abort();
            } // If there is an existing XHR, abort it.
            /*x = $.get(_.config.url + _.search.value, function(data) {
              _.showSearchResults(data, _.search.value);
            });*/
            _.backend.get(_.config.url, {
              'term': _.search.value
            }, function(data){
              _.showSearchResults(data, _.search.value);
            }, 'general');
          }
        }, 500); // 1 sec delay to check.
      }
    });

    //onclick searchresult
    this.on(this.searchresults, 'click', '.media', function(e) {
      console.log(e.target.classList);
      if (e.target.classList.contains('tabLink') || e.target.classList.contains('fa-external-link-alt')) {
        return false;
      }
      _.resultClick(this);
    });

    /*
     * dynamic prototyping
     *
     * if(typeof this.meinefunktion !== 'function') {
     storage.prototype.meinefunktion = function() {
     //code
     }
     }*/

    _.executeCallback(callback, '', 'initSearchBox');
  };

  SearchBox.prototype.resultClick = function(element) {
    if (!element) return false;

    var _ = this;
    if (element && element.dataset.json) {
      /*if (element.dataset.searchvalue == 3) {
        alert('Ich bin aktuel nicht im Büro und ab dem 04.10.2022 wieder für dich persönlich erreichbar. Kontaktiere in dringenden Fällen bitte den DokuMe Support.\n\nI am currently out of office and will be personally available for you again from 04.10.2022. Please contact DokuMe Support in urgent cases.\n\nNicki Graczyk');
      }*/
      //value found
      _.searchvalue.value = element.dataset.searchvalue;
      _.search.value = element.dataset.searchtitle;
      _.parent.classList.remove('dokume-fullscreen');
      _.searchresults.innerHTML = '';
      if (_.config.successHandler) {
        var userJSON = JSON.parse(element.dataset.json);
        _.config.successHandler(userJSON);

        //save last user search
        var oldResult = _.lastUserSearch.find(user => user.value == userJSON.value);
        if (!oldResult) {
          _.lastUserSearch.push(userJSON);

          if (_.lastUserSearch.length > 5) {
            _.lastUserSearch.shift();
          }

          localStorage.setItem('lastUserSearch', JSON.stringify(_.lastUserSearch));
        }
      }

    } else if (element.classList.contains('valueNotFound')) {
      //value not found
      if (_.config.errorHandler) {
        _.config.errorHandler(_.search.value);
      }

      _.searchvalue.value = '';
      _.search.value = '';
      _.parent.classList.remove('dokume-fullscreen');
      _.searchresults.innerHTML = '';
    }
  };

  SearchBox.prototype.showSearchResults = function(data, searchString) {
    var _ = this;
    var results = '';

    if (data.SUCCESS === true && data.MESSAGE.length > 0) {
      data = data.MESSAGE;

      for (var idx in data) {
        if (!data[idx].description) data[idx].description = '';

        results += `
        <div class="media" data-json='${(JSON.stringify(data[idx])).replace("'", " ")}' data-searchvalue="${data[idx].value}" data-searchtitle="${data[idx].label}" data-isgroup="${data[idx].ISGROUP}">
            <div class="media-left">
                <img class="img-circle" width="50px" class="media-object" src="${DM_CORE_CONFIG.BACKEND_URL}/functions.php/storage/avatar/${data[idx].value}">
            </div>
            <div class="media-body">
                <!--{(data[idx].aktiv !== '1' && data[idx].ISGROUP != 1) ? '<i class="fa fa-times-circle-o pull-right"></i>' : ''}-->
                <a href="#/access/${data[idx].value}" class="btn btn-secondary btn-sm tabLink" target="_blank"><i class="fas fa-external-link-alt"></i></a>
                <h4 class="media-heading">${data[idx].label}</h4>
                <small>${(data[idx].ISGROUP == 0) ? data[idx].description : "Gruppe"}</small>
            </div>
        </div>`;
      }
    } else {
      if (!this.config.errorText) {
        this.config.errorText = '{searchString} nicht gefunden.';
      }
      var errorText = (this.config.errorText).replace('{searchString}', searchString);
      results += '<div class="media valueNotFound">' + errorText + '</div>';
    }
    this.searchresults.innerHTML = results;

    document.addEventListener('click', this.clickCloseSearch.bind(this));
  };

  SearchBox.prototype.val = function(data) {
    this.search.value = data;
  };

  /*
   * removeEventListener doesnt work right now.
   */
  SearchBox.prototype.clickCloseSearch = function(e) {
    if (window.innerWidth < 769) return false;

    var _ = this;

    if (e.target !== _.parent && !_.parent.contains(e.target)) {
      //element.parentNode.removeChild(element);
      _.parent.classList.remove('dokume-fullscreen');
      _.searchresults.innerHTML = '';
      document.removeEventListener('click', _.clickCloseSearch);
    }
  };

  SearchBox.prototype.guid = function() {
    function s4() {
      return Math.floor((1 + Math.random()) * 0x10000).toString(16).substring(1);
    }
    return s4() + s4() + '-' + s4() + '-' + s4() + '-' + s4() + '-' + s4() + s4() + s4();
  };

  SearchBox.prototype.isChildOf = function(child, parent) {
    if (child.parentNode === parent) {
      return true;
    } else if (child.parentNode === null) {
      return false;
    } else {
      //console.log(this);
      return this.isChildOf(child.parentNode, parent);
    }
  };

  SearchBox.prototype.on = function(elSelector, eventName, selector, fn) {
    var element = elSelector;

    element.addEventListener(eventName, function(event) {
      var possibleTargets = element.querySelectorAll(selector);
      var target = event.target;

      for (var i = 0, l = possibleTargets.length; i < l; i++) {
        var el = target;
        var p = possibleTargets[i];

        while (el && el !== element) {
          if (el === p) {
            return fn.call(p, event);
          }

          el = el.parentNode;
        }
      }
    });
  };

  /*
   * check if callback is defined, else console info
   */
  SearchBox.prototype.executeCallback = function(callback, data, name) {
    if (typeof callback === 'function') {
      callback(data);
    } else {
      console.info('Define callback for ' + name);
    }
  }

  //expose FileStorage to window
  window.SearchBox = SearchBox;

})();
