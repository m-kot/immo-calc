'use strict';

var backend = null;
var publicBackend = null;
var socket = null;
var auth = null;

var SERVER_URL = DM_CORE_CONFIG.BACKEND_URL + '/';
var DM_CONFIG = null;

var str = window.location.href;
var arrValue = str.split("//");
var arrSecondValue = arrValue[1].split(".");
var subdomain = arrSecondValue[0];

var DM_CORE = (function () {

  var IS_INIT_ROUTES = false;

  init();

  function init() {

    if (DM_CORE_CONFIG.SUBDOMAIN_WHITELABEL === true && DM_CORE_CONFIG.DOKUME_PLATFORM !== 'app') {
      DM_WHITELABEL.init(subdomain);
    }

    initLanguage();

    // reject browser plugin
    $.reject();

    if (typeof DM_CORE_CONFIG === 'undefined') {
      console.warn('DM_CORE_CONFIG is not loaded.');
      elq('#dmLoadingDIV h3').innerHTML = 'DM_CORE_CONFIG is not loaded.';
      return false;
    }

    if (DM_CORE_CONFIG.AUTH_MODE !== 'public') {
      //console.log({SERVER_URL});
      auth = new DokuMe_Auth(SERVER_URL);
      backend = new DokuMe_Backend(SERVER_URL, auth.config.token, loginCheck);
    }

    if (DM_CORE_CONFIG.AUTH_MODE === 'public' || DM_CORE_CONFIG.AUTH_MODE === 'mix') {
      publicBackend = new DokuMe_PublicBackend(DM_CORE_CONFIG.BACKEND_URL, DM_CORE_CONFIG.API_KEY, DM_CORE_CONFIG.PROFILE_ID);
    }

    initErrorLogging();

    bindEvents();

  }

  function start() {
    if (DM_CORE_CONFIG.AUTH_MODE === 'private') {
      authCheck();
    } else if (DM_CORE_CONFIG.AUTH_MODE === 'landing' && DM_CORE_CONFIG.LANDING_URL) {
      window.location = DM_CORE_CONFIG.LANDING_URL;
      initRoutes();
    } else if (DM_CORE_CONFIG.AUTH_MODE === 'public' && DM_CORE_CONFIG.LANDING_URL) {
      window.location = DM_CORE_CONFIG.LANDING_URL;
      initRoutes();
    } else if (DM_CORE_CONFIG.AUTH_MODE === 'mix' && DM_CORE_CONFIG.LANDING_URL) {
      authCheck();
      //window.location = DM_CORE_CONFIG.LANDING_URL;
    } else {
      initRoutes();
    }
  }

  function initRoutes() {
    if (IS_INIT_ROUTES) {
      // console.log('bin hier raus');
      return false;
    }

    if (typeof cordova !== 'undefined') {
      document.addEventListener('deviceready', function () {
        //DM_ROUTING.routingAuthCheck();
        DM_ROUTING.init();
        hasher.init();
      });
    } else {
      //DM_ROUTING.routingAuthCheck();
      DM_ROUTING.init();
      hasher.init();
    }

    IS_INIT_ROUTES = true;
  }

  function bindEvents() {
    $('#systemNotificationDIV').on('click', '#resetWorkflowBTN', resetAccountWorkflow);

    $('#systemNotificationDIV, #DM_INFO_MODAL').on('click', '[data-deleteusertour]', deleteUserTour);

    initLocalStorageSyncListener();
  }

  function initErrorLogging() {

    if (subdomain !== 'dokume') return false;

    Sentry.init({
      dsn: 'https://b1dc4d05ddd7477298c9c2c28c19bc57@sentry.io/200154',
      debug: true,
      //maxBreadcrumbs: 50,
    });

    Sentry.configureScope(function (scope) {
      scope.setUser({
        "id": auth.config.id,
        "username": auth.config.user
        //"email": "john.doe@example.com",
      });
    });

  }

  function initLanguage() {
    DokuMe_Translation.loadLocales(false, function () { });
  }

  function logout(callback) {

    elq('#dmLoadingDIV h3').innerHTML = transCls.i18Return('login', 'willBeLoggedOut', 'You will be logged out.');
    el('dmLoadingDIV').style.display = 'flex';

    var PUSH_TEMP = DM_CORE_CONFIG.DOKUME_PLATFORM === 'app' ? DM_MOBILE_PUSHNOTIFICATION : DM_PUSHNOTIFICATION;

    PUSH_TEMP.unregister(function () {
      auth.logout(function () {
        localStorage.clear();
        socket.ws.close();
        socket = null;

        if (callback) {
          callback();
        } else if (DM_CORE_CONFIG.LOGOUT_CALLBACK) {
          DM_CORE_CONFIG.LOGOUT_CALLBACK(function () {
            initRoutes();
            authCheckSuccess(data.MESSAGE);
          });
        } else if (DM_CORE_CONFIG.DOKUME_PLATFORM !== 'app') {
          //window.location = '../';
          //window.location = '#/login';
          start();
        } else {
          //window.location = '#/login';
          start();
        }

      });
    });

  }

  function authCheck() {
    if (typeof auth === 'undefined') return false;

    if (!auth || !auth.config || auth.config.token === '' || auth.config.token === null) {
      auth.loggedIn = false;
      loginCheck();
      return false;
    }

    backend.setAccess();

    backend.get('init', null, function (data) {

      el('dmLoadingDIV').style.display = 'none';

      if (data.SUCCESS !== true) {
        auth.loggedIn = false;
        loginCheck();
        return false;
      }

      auth.loggedIn = true;
      auth.config.id = data.MESSAGE.ID;
      auth.config.user = data.MESSAGE.FIRSTNAME + ' ' + data.MESSAGE.LASTNAME;
      DM_CORE_CONFIG.PLATFORM_TEMPLATE = data.MESSAGE.VERSION;

      DM_CONFIG = data.MESSAGE;

      checkAccountStatus();

      //socket
      if (DM_CORE_CONFIG.WEBSOCKET) {
        if (typeof (socket) !== 'undefined' && socket && socket.ws) {
          socket.ws.refresh();
        } else {
          socket = new DokuMe_Socket(DM_CORE_CONFIG.WEBSOCKET);
        }
      }

      DM_TEMPLATE.setDesign(DM_CONFIG.DESIGN);

      if (DM_CONFIG.WHITELABEL) {
        DM_WHITELABEL.init(DM_CONFIG.WHITELABEL);
      }

      if (DM_CORE_CONFIG.LOGIN_CALLBACK) {
        DM_CORE_CONFIG.LOGIN_CALLBACK(function () {
          initRoutes();
          authCheckSuccess(data.MESSAGE);
        });
      } else {
        initRoutes();
        authCheckSuccess(data.MESSAGE);
      }

    }, 'general');

  }

  function authCheckSuccess(data) {

    // turn off app lock so all pages are available
    DM_ROUTING.toggleAppLock(false);

    if (data.LANGUAGE) {
      DokuMe_Translation.setLng(data.LANGUAGE);
    }

    initLanguage();

    var doRedirect = true;

    if (data.WORKFLOW_STATE === 'pendingAgeCheck' || data.WORKFLOW_STATE === 'pendingParentConfirmation' || data.WORKFLOW_STATE === 'locked') {
      window.location = '#/onboarding/age_check';

      doRedirect = false;

    } else if (data.WORKFLOW_STATE === 'willBeDeleted') {
      window.location = '#/onboarding/delete_account';

      doRedirect = false;

    } else if (data.DATA_ACTION_NEEDED == 3) {
      get_param3 = window.location.hash;

      window.location = '#/userdata/index/3';

      doRedirect = false;

    } else if (data.WORKFLOW_STATE === 'passwordSet') {
      el('systemNotificationDIV').insertAdjacentHTML('beforeend', `<div class="alert alert-warning" onclick="window.location = '#/onboarding/confirm';" data-i18n="signup.pleaseConfirmEmail">${transCls.i18Return('members_administrative', 'noData', 'Please confirm your email address')} <span class="text-primary" data-i18n="basic.here">${transCls.i18Return('basic', 'here', 'Here')}</span>.</div>`);

      console.log('Create fn that after some days this message will be displayed always.');
      if (DM_CORE_CONFIG.VERIFY_EMAIL && DM_CORE_CONFIG.VERIFY_EMAIL === true) {
        window.location = '#/onboarding/confirm';

        doRedirect = false;
      }

    }

    if (doRedirect) {

      if (page_name === 'login' && get_param1) {

        var redirect = '';

        try {
          redirect = atob(get_param1);
        } catch (e) {
          window.location = DM_CORE_CONFIG.AUTH_SUCCESS_URL;
        }

        if (redirect.includes('#')) {
          window.location = redirect;
        }

      } else if (data.STARTPAGE && data.STARTPAGE !== '' && data.STARTPAGE !== page_name) {

        if (window.location.hash === '#/login' || window.location.hash === '' || window.location.hash === '#' || window.location.hash === '#/') {
          window.location = '#/' + data.STARTPAGE;
        }

      } else if (page_name === 'login' || page_name === 'signup') {

        if (page_name === 'signup' && get_param1) {
          window.location = '#/subscription/choose/' + get_param1;
        } else {
          window.location = DM_CORE_CONFIG.AUTH_SUCCESS_URL;
        }

      } else {

        // redirect only if no path available
        if (window.location.hash === '' || window.location.hash === '#' || window.location.hash === '#/') {
          hasher.setHash(DM_CORE_CONFIG.AUTH_SUCCESS_URL.replace('#/', ''));
          window.location = DM_CORE_CONFIG.AUTH_SUCCESS_URL;
        }

      }

    }

    el('dmLoadingDIV').style.display = 'none';

    if (DM_CORE_CONFIG.DOKUME_PLATFORM === 'app') {
      DM_MOBILE_PUSHNOTIFICATION.init();
    } else {
      DM_PUSHNOTIFICATION.getToken();
    }
  }

  function loginCheck(forceLogin, callback) {

    if (DM_CORE_CONFIG.AUTH_MODE === 'private' || forceLogin === true) {
      initRoutes();
      /*************/

      if (auth.loggedIn === 'isLoggingIn') {
        return false;
      } else if (auth.loggedIn === 'isLoginPage') {
        if (!window.location.href.includes('login')) {
          window.location = '#/login/index/' + btoa(window.location.hash.replace('/login/index/', ''));
        }

        el('dmLoadingDIV').style.display = 'none';

        return false;
      }

      auth.loggedIn = 'isLoggingIn';

      if ((typeof page_name !== 'undefined' && (page_name === 'login' || page_name === 'signup')) || (typeof app_name !== 'undefined' && app_name === 'realestate_signup') || window.location.hash.includes('login')) {
        auth.loggedIn = false;

        el('dmLoadingDIV').style.display = 'none';

        return false;

      } else if (auth.config.refresh && auth.config.refresh !== null) {
        auth.refresh_token(function (data) {
          if (data === false) {

            auth.loggedIn = false;

            if (page_name !== 'login' || page_name !== 'signup') {
              window.location = '#/login/index/' + btoa(window.location.hash.replace('/login/index/', ''));
            }

            return false;
          }

          backend.setAccesstoken(auth.config.token);

          backend.retryRequests();

          if (typeof (socket) !== 'undefined' && socket && socket.ws) {
            socket.ws.refresh();
          }

          //initLanguage();

          if (page_name === 'login' || page_name === 'signup' || !page_name || page_name === '') {

            page_name = null;

            if (window.location.hash === '' || window.location.hash === DM_CORE_CONFIG.AUTH_SUCCESS_URL) {
              console.log('gehe zu success url');
              window.location = DM_CORE_CONFIG.AUTH_SUCCESS_URL;
            } else {
              window.location = window.location.href;
            }

            initLanguage();
          } else {

            backend.retryRequests();

            //return false;

            /*if (confirm('Es könnte sein, dass neue Daten zur Verfügung stehen. Möchtest du die Seite neu laden?\n\nAchtung damit gehen alle nicht gespeicherten Daten verloren.')) {
              initLanguage();
              location.reload();
            } else {
              //console.log('nichts tun');
              DM_TEMPLATE.showSystemNotification(1, 'Du wurdest aus Sicherheitsgründen neu eingeloggt. Bitte versuche es erneut.')
              return false;
            }*/
          }

          if (typeof callback === 'function') {
            callback(auth.config.token);
          }
        });

      } else {

        // no refresh token available
        auth.loggedIn = false;

        if (window.location.hash.indexOf('signup') > -1) {
          window.location = '#/login/signup';

          if (typeof hasher !== 'undefined') {
            hasher.setHash('login/signup')
          }

        } else if (window.location.hash === '' || window.location.hash === '#' || window.location.hash === '#/' || window.location.hash === DM_CORE_CONFIG.AUTH_SUCCESS_URL || (window.location.hash.indexOf('login') > -1 && window.location.hash.indexOf('index') < 0)) {

          window.location = '#/login';

          if (typeof hasher !== 'undefined') {
            hasher.setHash('login');
          }
        } else {

          var redirect = '#/login/index/' + btoa(window.location.hash.replace('/login/index/', ''));

          window.location = redirect;

          if (typeof hasher !== 'undefined') {
            //hasher.setHash(redirect)
          }
        }
      }
      /* else if (page_name !== 'onboarding') {console.log('he');
        window.location = '#/login';
        $('#mainContent').load('APPS/login/index.html');
      }*/



      /*************/



    }

    el('dmLoadingDIV').style.display = 'none';
  }

  function checkAccountStatus() {

    el('systemNotificationDIV').innerHTML = '';


    if (DM_CONFIG && DM_CONFIG.USER_TOUR_DONE) {
      var onboardingTour = DM_CONFIG.USER_TOUR_DONE.find(a => (a.FAQ_TOUR_ID == 1 || a.FAQ_TOUR_ID == 5) && a.DONE == 1 && a.IN_GROUP != 1);

      if (!onboardingTour) {
        DM_DOKUME_FAQ.getTour(5, showUserTour);
      }

      /*
      Big banner that there is a new DokuMe version
      var newDMAnnouncement = DM_CONFIG.USER_TOUR_DONE.find(a => a.FAQ_TOUR_ID == 2);
      if (!newDMAnnouncement && subdomain == 'my' || auth.config.id == 3) {
        showNewDokuMeAnnouncement();
      }*/

      var installRoutine = DM_CONFIG.USER_TOUR_DONE.find(a => a.ONBOARDING_TYPE == 1 && a.DONE == 0);
      if (installRoutine) {// && subdomain == 'my') {
        window.location = `#/onboarding/start/${installRoutine.ONBOARDING_TYPE}/${installRoutine.ID}`;
      }

    }

    if (DM_CONFIG && DM_CONFIG.WORKFLOW_STATE && DM_CONFIG.WORKFLOW_STATE === 'forgotPassword') {
      el('systemNotificationDIV').insertAdjacentHTML('beforeend', `
      <div id="passwordChangeWarning" class="alert alert-warning">
        Jemand hat versucht dein Passwort zu ändern. Falls die Aktion nicht von dir kam, solltest du aus Sicherheitsgründen dein Passwort in den <a href="#/settings">Einstellungen</a> ändern.
        <br><br>
        Bei Fragen kannst du uns gerne jederzeit kontaktieren: <a href="#/help/index/passwordChangedInfo">Hilfe</a>
        <br><br>
        <button id="resetWorkflowBTN" class="btn btn-secondary">Das war ich - Meldung löschen</button>
      </div>`);
    }

    if (DM_CONFIG && DM_CONFIG.TRIAL_END) {
      if (moment().isBefore(DM_CONFIG.TRIAL_END, 'days')) {
        el('systemNotificationDIV').insertAdjacentHTML('beforeend', `
        <div class="alert alert-info">
          <span data-i18n="subscription.welcomeTestPhase">${transCls.i18Return('subscription', 'welcomeTestPhase', 'Welcome to the free trial period. Test your account for')}</span> ${moment(DM_CONFIG.TRIAL_END).diff(moment(), 'days')} <span data-i18n="subscription.days">${transCls.i18Return('subscription', 'days', 'Days')}</span>.
          <a href="#/subscription/choose" data-i18n="subscription.activateAccount">${transCls.i18Return('subscription', 'activateAccount', 'Activate account')}</a>
        </div>`);
      } else if (moment().diff(DM_CONFIG.TRIAL_END, 'days') < 4) {
        el('systemNotificationDIV').insertAdjacentHTML('beforeend', `
        <div class="alert alert-danger">
          <span data-i18n="subscription.trialExpired">${transCls.i18Return('subscription', 'trialExpired', 'Your free trial has expired.')}</span>
          <a href="#/subscription/choose" data-i18n="">${transCls.i18Return('subscription', 'activateAccount', 'Activate account')}</a>
        </div>`);

      } else {
        window.location = '#/subscription';
      }
    }

    checkSupportSession();
  }

  function checkSupportSession() {
    if (localStorage.getItem('supportAuthConfig')) {
      el('systemNotificationDIV').insertAdjacentHTML('beforeend', `
      <div class="alert alert-info">
        <button id="supportAuthConfig" class="btn btn-danger btn-sm pull-right"><i class="fas fa-times animated pulse infinite" style="color:#fff"></i> Stop support</button>
        Du bist im Support Zugriff auf ${auth.config.user}
      </div>`);
      el('supportAuthConfig').addEventListener('click', stopSupportSession);
    }
  }

  function stopSupportSession() {
    if (!confirm('Do you really want to stop the support session?')) return false;
    localStorage.setItem('authConfig', localStorage.getItem('supportAuthConfig')), localStorage.removeItem('supportAuthConfig');
    location.reload();
  }

  function resetAccountWorkflow() {
    backend.saveObject(2, auth.config.id, {
      WORKFLOW_STATE: 'completed'
    }, function (data) {
      if (!util.errorHandler(data, 1)) return false;

      $('#passwordChangeWarning').remove();
    }, 1);
  }

  function showNewDokuMeAnnouncement() {
    el('systemNotificationDIV').insertAdjacentHTML('beforeend', `
    <div class="usertour" style="display: none;position: fixed; z-index: 99999999999; top: 0; bottom: 0; left: 0; right: 0; display: flex; align-items: center; justify-content: center; background-color: #fff; flex-direction: column;">

    <div class=" card-block" style="width:95%;max-width: 800px;">
      
      <h2 class="mb-3">🚀 DokuMe 2.0 ist bereit für Dich!</h2><br>
      <div class="col-md-12">
        <p>Wir haben ein Design Update für Dich vorbereitet. Die Nutzung von DokuMe wird einfacher und übersichtlicher.
          Alle Funktionen bleiben für Dich bestehen und die wesentlichen Inhalte erhalten mehr Raum und
          Fokus!
          <br><br>
          <div class="d-grid">
          <button data-deleteusertour="2" class="btn btn-primary btn-lg animated pulse infinite">Jetzt loslegen</button>
          </div>
        </p>
        <p>Feedback &amp; Fragen hierzu gerne an <a href="mailto:info@dokume.net">info@dokume.net</a> senden. Wir freuen
          uns!</p>
      </div>
    </div>
    <img src="https://cdn.dokume.net/img/logo/dokume_logo_black_plain.png" style="height:50px">
  </div>
    `);
  }

  function showUserTour(data) {

    if (el('mainContent').classList.contains('DM_FULLSCREEN')) return false;

    //elq('#DM_INFO_MODAL .modal-title').innerHTML = data.TITLE;
    elq('#DM_INFO_MODAL .modal-header').style.display = 'none';
    elq('#DM_INFO_MODAL .modal-image').classList.add('d-flex');
    elq('#DM_INFO_MODAL .modal-image').style.backgroundImage = `url(https://gos3.io/dokume-storage/user-13199/storage/127696.jpeg)`;
    elq('#DM_INFO_MODAL .modal-image').innerHTML = `
    <h3 class="align-self-center flex-fill text-center" data-i18n="DM_TOUR.title_5">${data.TITLE}</h3>
    <button type="button" class="btn-close btn-close-white align-self-start" data-bs-dismiss="modal" aria-label="Close"></button>`;
    elq('#DM_INFO_MODAL .modal-body').innerHTML = `
    <p data-i18n="DM_TOUR.description_5">${data.DESCRIPTION}</p>`;
    elq('#DM_INFO_MODAL .modal-footer').innerHTML = `
    <div class="d-grid gap-2 w-100">
      <button class="btn btn-primary btn-lg animated pulse infinite" onclick="DM_TEMPLATE_UI.startHelp('0', ${data.ID}, 1)" data-i18n="DM_TOUR.start" data-deleteusertour="${data.ID}" data-bs-dismiss="modal">Start tour</button>
      <button class="btn btn-secondary btn-sm" data-deleteusertour="${data.ID}" data-bs-dismiss="modal" data-i18n="DM_TOUR.delete">Skip</button>
    </div>`;

    $('#DM_INFO_MODAL').i18n();
    $('#DM_INFO_MODAL').modal('show');

    /*el('systemNotificationDIV').insertAdjacentHTML('beforeend', `
    <div class="usertour alert alert-info">
      <h3>${data.TITLE}</h3>
      <p>${data.DESCRIPTION}</p>
      <div class="d-grid gap-2 d-md-block">
        <button class="btn btn-primary" onclick="DM_TEMPLATE_UI.startHelp('0', ${data.ID})" data-i18n="DM_TOUR.start">Zeige mir alle Neuigkeiten</button>
        <button class="btn btn-danger" data-deleteusertour="${data.ID}" data-i18n="DM_TOUR.delete">Benachrichtigung löschen</button>
      </div>
    </div>`);

    $('#systemNotificationDIV').i18n();*/
  }

  function updateUserTour(tourId, setDone, callback) {

    var updateTour = true;

    // check if tour is already saved but reseted. In this case just update the tour. Otherwise save a new entry
    if (access_id && page_name != 'progress') {
      var app = DM_APPS.findAppByURL(page_name);
      if (!app) {
        updateTour = false;
      } else {
        var temp = DM_CONFIG.USER_TOUR_DONE.find(a => a.APP_ID == app.ID && a.IN_GROUP == 1);
        if (temp) {
          tourId = temp.ID;
        } else {
          updateTour = false;
        }
      }
    }

    if (updateTour) {
      backend.saveObject(454, tourId, {
        DONE: setDone
      }, function (data) {
        if (!util.errorHandler(data, 1)) return false;

        DM_CONFIG.USER_TOUR_DONE.find(a => a.ID == tourId).DONE = setDone;

        DM_TEMPLATE_UI.checkOnboardingProgress();

        if (callback) {
          callback(data);
        }
      }, 1);
    } else {
      checkGroupTours(tourId);
    }

  }

  // save available undone group tour
  function checkGroupTours(groupTourId) {

    var groupTour = access_info.AVAILABLE_TOURS.find(a => a.ID == groupTourId);
    if (!groupTour) return false;

    groupTour.DONE = 1;

    backend.saveObject(454, null, groupTour, function (data) {
      if (data.SUCCESS !== true) return false;

      groupTour.ID = data.MESSAGE;

      DM_CONFIG.USER_TOUR_DONE.push(groupTour);
      DM_TEMPLATE_UI.checkOnboardingProgress();
    }, 1);
  }

  function deleteUserTour() {
    var btn = this;

    backend.saveObject(454, null, {
      DONE: 1,
      FAQ_TOUR_ID: this.dataset.deleteusertour
    }, function (data) {
      if (!util.errorHandler(data, 1)) return false;

      $(btn).closest('.usertour').remove();
    }, 1);
  }

  function initLocalStorageSyncListener() {
    window.addEventListener('storage', function (event) {
      if (event.key !== 'authConfig') return false;

      var stop = false;

      var authConfig = event.newValue;

      if (!authConfig || authConfig == 'null') {
        return false;
      }

      try {
        authConfig = JSON.parse(atob(authConfig));
      } catch (e) {

        try {
          authConfig = JSON.parse(authConfig);
        } catch (e2) {
          stop = true;
          console.warn(authConfig);
        }
      }

      if (stop) return false;

      auth.config = {
        token: (authConfig && authConfig.token) ? authConfig.token : null,
        refresh: (authConfig && authConfig.refresh) ? authConfig.refresh : null,
        id: (authConfig && authConfig.id) ? authConfig.id : null,
        user: (authConfig && authConfig.user) ? authConfig.user : null
      };

      localStorage.setItem('authConfig', event.newValue);

      if (typeof (socket) !== 'undefined' && socket && socket.ws) {
        socket.ws.refresh();
      }

      backend.setAccesstoken(auth.config.token);

    });
  }

  return {
    start,
    authCheck,
    loginCheck,
    logout,
    updateUserTour
  };

})();
