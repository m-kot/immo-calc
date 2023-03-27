var access_id, routingid, access_routingid = '';
var access_info;
var admin_id, isGroup;

var page_name, app_name;
var get_param1, get_param2, get_param3;

var accessInfos = null;

var LAST_LOADED_APP_CONFIG = null;

/* routing */
var DM_ROUTING = (function () {

  var pageTitle = el('pageTitle');

  var APP_LOCK = null;
  var APP_LOCK_WHITELIST = [];

  function init() {
    if (typeof cordova !== 'undefined') {
      document.addEventListener('deviceready', function () {
        initRoutes();
        initHasher();
      });
    } else {
      initRoutes();
      initHasher();
    }
  }

  function initRoutes() {
    //debug
    crossroads.addRoute('/debug/access/{id}/:page:/:subPage:/:param1:/:param2:/:param3:', function (id, page, subPage, param1, param2, param3) {
      backend.server = 'https://dokume.net/backend/debug/';
      console.warn('You are in debug mode');
      initRoute(id, null, page, subPage, param1, param2, param3)
    }).rules = {
      id: /^[0-9]+$/
    };

    crossroads.addRoute('debug/{page}/:subPage:/:param1:/:param2:/:param3:', function (page, subPage, param1, param2, param3) {
      backend.server = 'https://dokume.net/backend/debug/';
      console.warn('You are in debug mode');
      initRoute(page, subPage, param1, param2, param3);
    });

    // access
    crossroads.addRoute('/admin/{id}/{admin}/:page:/:subPage:/:param1:/:param2:/:param3:', function (id, admin, page, subPage, param1, param2, param3) {
      initRoute(id, admin, page, subPage, param1, param2, param3);
    }).rules = {
      id: /^[0-9]+$/,
      admin: /^[0-9]+$/
    };

    crossroads.addRoute('/access/{id}/:page:/:subPage:/:param1:/:param2:/:param3:', function (id, page, subPage, param1, param2, param3) {
      initRoute(id, null, page, subPage, param1, param2, param3);
    }).rules = {
      id: /^[0-9]+$/
    };

    //normale seiten
    crossroads.addRoute('{page}/:subPage:/:param1:/:param2:/:param3:', function (page, subPage, param1, param2, param3) {
      initRoute(null, null, page, subPage, param1, param2, param3);
    });

    //keine route passt
    crossroads.bypassed.add(function (request) {

      if (DM_CORE_CONFIG.AUTH_MODE === 'private' && DM_CONFIG && DM_CONFIG.STARTPAGE) {
        console.log('hardcoded wegmachen');
        if (auth.config.id == 27753 || auth.config.id == 17188) {
          window.location = '#/access/32912/events_registration';
          return false;
        }
        window.location = '#/' + DM_CONFIG.STARTPAGE;
      } else if (DM_CORE_CONFIG.LANDING_URL) {
        window.location = DM_CORE_CONFIG.LANDING_URL;
      } else {
        $("#mainContent").load(`APPS/dashboard_app/index.html`);
      }

    });
  }

  /*****************setup hasher*******************/
  function initHasher() {

    hasher.initialized.add(parseHash);
    //parse initial hash
    hasher.changed.add(parseHash);
    //parse hash changes
    //hasher.init(); -> init hasher on dokume start
    //start listening for history change

    //update URL fragment generating new history record
    //hasher.setHash('dashboard');
  }

  function parseHash(newHash, oldHash) {
    crossroads.parse(newHash);
    DM_PUBSUB.emit('DM_PAGE_CHANGED', null);

    /*var currentUrl = location.href;
    
    _paq.push(['setReferrerUrl', oldHash]);
    _paq.push(['setCustomUrl', newHash]);
    _paq.push(['setDocumentTitle', 'My New Title' + (new Date()).getTime()]);
    console.log('mache analytics');*/

    /*// remove all previously assigned custom variables, requires Matomo (formerly Piwik) 3.0.2
    _paq.push(['deleteCustomVariables', 'page']); 
    _paq.push(['trackPageView']);

    // make Matomo aware of newly added content
    var content = document.getElementById('content');
    _paq.push(['MediaAnalytics::scanForMedia', content]);
    _paq.push(['FormAnalytics::scanForForms', content]);
    _paq.push(['trackContentImpressionsWithinNode', content]);
    _paq.push(['enableLinkTracking']);*/


    /*reset menus*/

    /*if (window.innerWidth < 770) {
      navDIV.style.display = "none";
      asideDIV.style.display = "none";
    } else if (window.innerWidth > 770 && window.innerWidth < 1000) {
      asideDIV.style.display = "none";
    }
    overlayDIV.style.display = "none";

    $(".DokuMe-Menu li").removeClass("active");
    $(".DokuMe-Menu [href='#/" + newHash + "']").addClass("active");*/
  }

  function changeHash(url, setGet_param1, setGet_param2) {
    hasher.changed.active = false;

    if (setGet_param1 || setGet_param1 === null) {
      get_param1 = setGet_param1;
    }

    if (setGet_param2 || setGet_param2 === null) {
      get_param2 = setGet_param2;
    }

    hasher.setHash(url);
    hasher.changed.active = true;
  }

  function initRoute(id, admin, page, subPage, param1, param2, param3) {
    /*if ((typeof auth.config.token === 'undefined' || !auth.config.token || auth.config.token === '' || auth.loggedIn !== true) && page !== 'signup') {

      $("#mainContent").load("APPS/login/index.html");
      return false;

    }*/

    if (app_name != page) {
      // DM_TEMPLATE_UI.initAppbar(0);
    }

    //if (el('mainContentHeader').innerHTML == '' || access_id != id) {
    if (access_id != id) {
      access_id = id;
      elq('#DM_PROFILE_IMAGE img').src = '';
      elq('#DM_PROFILE_DIV .accessName').innerHTML = '';
      //DM_TEMPLATE_UI.DM_ROUTING.loadConfig("access");
    }

    el('mainContent').innerHTML = '';

    if (!id) {
      isGroup = null;

      access_info = null;
      accessInfos = null;
    }

    access_id = id;
    routingid = id ? `${access_id}/` : '';
    access_routingid = id ? `access/${access_id}/` : '';
    admin_id = admin;
    get_param1 = param1;
    get_param2 = param2;
    get_param3 = param3;
    app_name = page;

    backend.setAccess(access_id, admin_id);

    if (!page) {
      //page_name = 'dashboard_user';
      //getPage(page_name);
    } else if (!subPage) {
      page_name = page;
      getPage(page_name);
    } else {
      page_name = subPage;
      getPage(page_name, page);
    }

    if (page) {
      pageTitle.dataset.i18n = 'menu.' + page;
      pageTitle.innerHTML = i18next.t('menu.' + page);

      if (page !== 'dashboard') {
        localStorage.setItem('lastpage', JSON.stringify({
          name: 'menu.' + page,
          link: window.location.href
        }));
      }
    } else {
      pageTitle.dataset.i18n = '';
      pageTitle.innerHTML = '';
    }

  }

  function loadConfig(appUrl) {

    if (appUrl === LAST_LOADED_APP_CONFIG) {
      return false;
    }

    LAST_LOADED_APP_CONFIG = appUrl;

    el('mainContentHeader').innerHTML = '';
    $.getScript('APPS/' + appUrl + '/config.js');
  }

  function getPage(url, appUrl) {

    if ($('.navbar-collapse.show, .sidebar').length > 0) {
      $('.navbar-collapse.show, .sidebar').collapse('hide');
    }

    if (!checkAppLock(url, appUrl)) {
      url = 'confirm';
      appUrl = 'onboarding';
    }

    var loadingUrl = appUrl !== undefined ? `APPS/${appUrl}/${url}.html` : `APPS/${url}/index.html`;
    loadingUrl += '?v=' + Date.now();

    $('#mainContent').load(loadingUrl, function (response, status, xhr) {
      if (status === 'error') {
        el('mainContent').innerHTML = '<div style="margin-top:10%;text-align:center;vertical-align:center;"><img src="//dokume.net/404/web/images/error-img.png" title="error" style ="max-width:90%;"><h1><span style="color:red;">Ohh.....</span>You requested a page that is no longer there.<h1><br><a href="#/dashboard" class="btn btn-lg btn-success">Back to dashboard</a></div>';
      }

      el('helpBTN').href = '#/help/index/' + url;

      $('main').i18n();
    });

    loadConfig(appUrl ? appUrl : url);
  }

  function checkAppLock(url, appUrl) {
    if (APP_LOCK && !APP_LOCK_WHITELIST.includes(url) && !APP_LOCK_WHITELIST.includes(appUrl)) {
      return false;
    }

    return true;
  }

  function toggleAppLock(state, whitelist) {
    if (state) {
      APP_LOCK = true;
      APP_LOCK_WHITELIST = whitelist;
    } else {
      APP_LOCK = false;
    }
  }

  return {
    init,
    toggleAppLock,
    checkAppLock,
    getPage,
    loadConfig,
    changeHash
  };
})();
