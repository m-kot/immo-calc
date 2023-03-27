'use strict';

var DM_MAIN = function () {
  init();

  function init() {
    DM_TEMPLATE.init();
    DM_CORE_CONFIG.LOGIN_CALLBACK = login;
    DM_CORE_CONFIG.LOGOUT_CALLBACK = logout;
    elq('.navbar-brand').href = DM_CORE_CONFIG.LANDING_URL;
    elq('.navbar-brand-sm').href = DM_CORE_CONFIG.LANDING_URL;
    transCls = new DokuMe_SetTrans(backend);
    idbCls = new idbApp();
    initServiceWorker();
    bindEvents();
    DM_CORE.start();
  }

  function bindEvents() {
    el('logoutBTN').addEventListener('click', function (e) {
      e.preventDefault();
      DM_CORE.logout();
    });
  }

  function login(callback) {
    el('loginBTN').style.display = 'none';
    el('logoutBTN').style.display = 'block';
    $('.loggedInOnly').show();
    el('DM_PROFILE_DIV').innerHTML = "<span class=\"accessName\">".concat(auth.config.user, "</span>");
    el('DM_PROFILE_IMAGE').innerHTML = "<img class=\"rounded-circle\" src=\"".concat(SERVER_URL, "functions.php/storage/avatar/").concat(auth.config.id, "\" onerror=\"this.src = 'https://cdn.dokume.net/img/logo/favicon/DokuMe_round_button.png'\">");

    if (DM_CONFIG.STARTPAGE) {
      elq('.navbar-brand').href = '#/' + DM_CONFIG.STARTPAGE;
      elq('.navbar-brand-sm').href = '#/' + DM_CONFIG.STARTPAGE;
    }

    if (typeof DM_TEMPLATE_UI !== 'undefined') {
      DM_TEMPLATE_UI.init(DM_CORE_CONFIG.PLATFORM_TEMPLATE);
    }

    if (typeof callback === 'function') {
      callback();
    }
  }

  function logout() {
    el('logoutBTN').style.display = 'none';
    $('.loggedInOnly').hide();
    el('loginBTN').style.display = 'block';
    el('DM_PROFILE_DIV').innerHTML = '';
    el('DM_PROFILE_IMAGE').innerHTML = '';
    DM_APPS.reset();
    DM_TENANTS.reset();

    if (DM_CORE_CONFIG.AUTH_MODE === 'private') {
      console.log(1);
      window.location = '#/login';
    } else if (window.location.hash === DM_CORE_CONFIG.LANDING_URL) {
      console.log(2);
      location.reload();
    } else {
      console.log(3);
      window.location = DM_CORE_CONFIG.LANDING_URL;
    }
  }

  function initServiceWorker() {
    if (DM_CORE_CONFIG.DOKUME_PLATFORM === 'app' || !('serviceWorker' in navigator)) return false;
    navigator.serviceWorker.register('service-worker.js', {//scope: '/platform/'
    }).then(function (registration) {
      DM_PUSHNOTIFICATION.init(registration);
    });

    navigator.serviceWorker.onmessage = function (event) {
      setImage(event);
    };
  }

  function setImage(event) {
    if (typeof DM_CHAT == 'undefined') {
      window.setTimeout(function () {
        setImage(event);
      }, 100);
      return false;
    }

    DM_CHAT.handleSharedTarget(event);
  }

  function getUserInfo() {
    accessInfos = null;
    backend.getFunction('rights/info', null, function (data) {
      if (data.SUCCESS !== true) return false;
      access_info = data.MESSAGE;

      if (data.MESSAGE.length < 1 && app_name !== 'market') {//console.log('hier');
      } else {
        elq('#DM_PROFILE_DIV').innerHTML = "<span class=\"accessName\">".concat(data.MESSAGE.NAME, "</span>");
        elq('#DM_PROFILE_IMAGE').innerHTML = "<img class=\"rounded-circle\" src=\"".concat(DM_CORE_CONFIG.BACKEND_URL, "/functions.php/storage/avatar/").concat(access_id, "\" onerror=\"this.src = 'https://cdn.dokume.net/img/logo/favicon/DokuMe_round_button.png'\">");
        $('.accessName').text(data.MESSAGE.NAME);
        accessInfos = {
          NAME: data.MESSAGE.NAME,
          isGroup: data.MESSAGE.ISGROUP,
          APPS: data.MESSAGE.APPS
        };

        if (data.MESSAGE.ISGROUP == 1) {
          accessInfos.MEMBERSHIP = data.MESSAGE.MEMBERSHIP;
          accessInfos.SEARCH_OPT_OUT = data.MESSAGE.SEARCH_OPT_OUT;
          $('#accessMarketLink').attr('href', '#/access/' + access_id + '/market');
        }

        if (data.MESSAGE.APPS.length < 3) {
          // show assistant only if this two apps are installed only
          var membersApp = data.MESSAGE.APPS.find(function (a) {
            return a.LINK == 'members';
          });
          var settingsApp = data.MESSAGE.APPS.find(function (a) {
            return a.LINK == 'group_settings';
          });

          if (membersApp && settingsApp) {
            hasher.setHash("".concat(access_routingid, "market/assistant"));
          } else {
            openDefaultPage(data.MESSAGE);
          }
        } else if (!app_name) {
          openDefaultPage(data.MESSAGE);
        } //showApps(data.MESSAGE.APPS);


        DM_PUBSUB.emit('accessInfos');
        DM_PUBSUB.reset('accessInfos');
        DM_TEMPLATE_UI.showApps(data.MESSAGE.APPS);
        DM_TEMPLATE_UI.checkOnboardingProgress();
      }
    });
  }

  function openDefaultPage(data) {
    if (data.ISGROUP == 1) {
      if (data.APPS.length > 0) {
        hasher.setHash("".concat(access_routingid).concat(data.APPS[0].LINK));
      } else {
        hasher.setHash("".concat(access_routingid, "dashboard_group"));
      }
    } else {
      hasher.setHash("".concat(access_routingid, "dashboard_user"));
    }
  }

  return {
    getUserInfo: getUserInfo,
    logout: logout
  };
}();

var notificationBar = el('systemNotificationBar');
var systemNotification = null;

function showSystemNotification(type, text, callback) {
  if (systemNotification) {
    clearTimeout(systemNotification);
  }

  text = decodeURIComponent(text);
  text = text.replace(/<[^>]+>/g, '');

  if (type === 3) {
    //showStaticNotification(type, text, callback);
    return false;
  }

  notificationBar.innerHTML = '<span class="animated bounceInDown">' + text + '</span>';
  notificationBar.classList.remove('danger');
  notificationBar.classList.remove('info');

  if (type === 0) {
    notificationBar.classList.add('danger');
  } else if (type === 2) {
    notificationBar.classList.add('info');
  }

  notificationBar.style.display = 'block';
  systemNotification = setTimeout(function () {
    notificationBar.style.display = 'none';
  }, 5000);

  if (callback) {
    notificationBar.addEventListener('click', callback);
  } else {
    notificationBar.addEventListener('click', function () {
      notificationBar.style.display = 'none';
    });
  }
}

function showToastNotification(type, text, callback) {
  text = decodeURIComponent(text);
  text = text.replace(/<[^>]+>/g, '');

  if (type === 3) {
    //showStaticNotification(type, text, callback);
    return false;
  }

  var colorClass = 'bg-success text-white';

  if (type == 0) {
    colorClass = 'bg-danger text-white';
  } else if (type == 2) {
    colorClass = 'bg-info text-white';
  }

  el('DM_LIVE_TOAST_WRAPPER').innerHTML = "\n  <div id=\"liveToast\" class=\"toast ".concat(colorClass, "\" role=\"alert\" aria-live=\"assertive\" aria-atomic=\"true\">\n    \n    <!--<div class=\"toast-header\">\n      <!--<img src=\"...\" class=\"rounded me-2\" alt=\"...\">\n      <strong class=\"me-auto\">Bootstrap</strong>\n      <small>11 mins ago</small>\n    </div>-->\n    <div class=\"toast-body\">\n      <button type=\"button\" class=\"btn-close btn-close-white pull-right\" data-bs-dismiss=\"toast\" aria-label=\"Close\"></button>\n      ").concat(text, "\n      \n      ").concat(callback ? "<div class=\"mt-2 pt-2 border-top\">\n      <button id=\"DM_TOAST_ACTION_BTN\" type=\"button\" class=\"btn btn-secondary btn-sm\" data-bs-dismiss=\"toast\" aria-label=\"Close\">Mehr Info</button>\n      </div>" : '', "\n    </div>\n  \n  </div>");

  if (callback) {
    el('DM_TOAST_ACTION_BTN').addEventListener('click', callback);
  }

  var toastLiveExample = document.getElementById('liveToast');
  var toast = new bootstrap.Toast(toastLiveExample);
  toast.show();
}

util.setShowFeedback(showToastNotification);