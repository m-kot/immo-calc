'use strict';

var DM_TEMPLATE_UI = (function () {

  var isAccess = null;

  function init(templateId) {

    if (templateId && templateId != 0) {
      $('#DM_MAIN_DIV > .sidebar').remove();
      $.getScript(`dokume/templates/template${templateId}.js`);
    } else {
      $('#DM_MAIN_DIV > .sidebar').remove();
      $.getScript(`dokume/templates/template1.js`);
    }/* else {
      initTemplate();
      DM_APPS.getApps(showApps, true);
    }*/

    bindEvents();

    checkOnboardingProgress();
    checkProjectTimer();
    checkWhitelabel();
  }

  function initTemplate() {
    DM_TENANTS.getGroups(showGroups);
    DM_TENANTS.getProfiles(showProfiles);
    toggleAccess(access_id ? true : false);

    el('dmLoadingDIV').style.display = 'none';
  }

  function bindEvents() {
    DM_PUBSUB.on('DM_PAGE_CHANGED', function () {
      toggleAccess(access_id ? true : false);

      $('.nav-link, .dropdown-item').removeClass('active');
      $(`[href="#/${app_name}"]`).addClass('active');

      if (!DM_APPS.getInstalledApps()) {
        DM_PUBSUB.on('getInstalledApps', function (data) {
          checkAppOnboarding(app_name, 3);
          DM_PUBSUB.reset('getInstalledApps');
        });
      } else {
        checkAppOnboarding(app_name, 4);
      }
    });

    el('DM_ACCESS_HEADER').addEventListener('click', turnOffAccess);

    $('#athletesGroupsSEARCH').on('keyup', searchAthleteGroups);
    $('#athletesGroupsSEARCH').on('search', searchAthleteGroups);

    el('DM_HELP_BTN').addEventListener('click', function (e) {
      e.preventDefault();
      startHelp();
    });
  }

  function searchAthleteGroups() {
    var value = $(this).val().toLowerCase();
    $('#DM_GROUPS_NAV a, #DM_PROFILES_NAV a').filter(function () {
      $(this).toggle($(this).text().toLowerCase().indexOf(value) > -1);
    });
  }

  function showApps(data) {

    if (typeof DM_DYNAMIC_TEMPLATE !== 'undefined') {
      DM_DYNAMIC_TEMPLATE.showApps(data);
      return false;
    }

    var menu = '';
    var menu2 = '';
    var menu3 = '';
    var externalMenu = false;
    var i = 0;

    for (var idx in data) {
      if (!data[idx].LINK) {
        continue;
      } else if (data[idx].LINK === 'menu_links') {
        externalMenu = true;
        continue;
      } else if (data[idx].LINK === 'group_settings') {
        el('DM_SETTINGS_LINK').style.display = 'block';
        el('DM_MARKET_LINK').style.display = 'block';
        continue;
      }

      var icon = '';

      if (data[idx].ICON && data[idx].ICON.indexOf('fa') > -1) {
        icon = `<i class="${data[idx].ICON.indexOf('fab') > -1 ? '' : 'fa '} ${data[idx].ICON}"></i>`
      } else if (data[idx].ICON && data[idx].ICON.indexOf('bi') > -1) {
        icon = `<i class="${data[idx].ICON}"></i>`
      } else {
        icon = '<img src="' + data[idx].ICON + '">';
      }

      if (i < 1) {
        var menuItem = `
        <li class="nav-item">
          <a class="nav-link ${i == 0 ? 'active' : ''}" href="#/${access_routingid}${data[idx].LINK}" title="${data[idx].NAME001}">
            ${icon}
            <span data-i18n="menu.${data[idx].LINK}">${data[idx].NAME001}</span>
          </a>
        </li>`;

        if (data[idx].LINK === 'dashboard' || data[idx].LINK === 'dashboard_coach') {
          menu = menuItem + menu;
        } else {
          menu += menuItem;
        }

      } else {
        menu2 += `
          <li>
            <a class="dropdown-item" href="#/${access_routingid}${data[idx].LINK}" title="${data[idx].NAME001}">
              ${icon}
              <span data-i18n="menu.${data[idx].LINK}">${data[idx].NAME001}</span>
            </a>
        </li>`;
      }

      i++;

      menu3 += `
        <li>
        <a href="#/${access_routingid}${data[idx].LINK}" class="nav-link ${idx == 0 ? 'active' : ''} link-dark">
          <div class="icon me-2">
            ${icon}
          </div>
          <span data-i18n="menu.${data[idx].LINK}">${data[idx].NAME001}</span>
        </a>
      </li>`;

    }

    if (externalMenu) {
      //getMenuLink();
    }

    if (menu2 !== '') {
      menu += `
        <li class="nav-item dropdown">
          <a class="nav-link dropdown-toggle" href="#" id="navbarDropdown" role="button" data-bs-toggle="dropdown" aria-expanded="false">
            Apps
          </a>
          <ul class="dropdown-menu" aria-labelledby="navbarDropdown">
            ${menu2}
          </ul>
        </li>`;
    }

    //$('#userMainMenu').html(menu).i18n();

    el('userMainMenu').innerHTML = menu;
    el('leftMenu').innerHTML = menu3;
    $('#userMainMenu, #leftMenu').i18n();
  }

  function showGroups(data) {
    var html = '';

    for (var idx in data) {
      html += `
      <li data-bs-dismiss="offcanvas" data-groupid="${data[idx].USERINTERFACE_ID}">
        <a href="#/access/${data[idx].USERINTERFACE_ID}" class="nav-link link-dark">
          <img class="img-circle lazy" data-src="${DM_CORE_CONFIG.BACKEND_URL}/functions.php/storage/avatar/${data[idx].USERINTERFACE_ID}"> ${data[idx].NAME}
        </a>
      </li>`;
    }

    el('DM_GROUPS_NAV').innerHTML = html;
    DM_TEMPLATE.lazyLoad();
  }

  function showProfiles(data) {
    var html = '';

    for (var idx in data) {
      html += `
      <li data-bs-dismiss="offcanvas" data-groupid="${data[idx].USERINTERFACE_ID}">
        <a href="#/access/${data[idx].USERINTERFACE_ID}" class="nav-link link-dark">
          <img class="img-circle lazy" data-src="${DM_CORE_CONFIG.BACKEND_URL}/functions.php/storage/avatar/${data[idx].USERINTERFACE_ID}"> ${data[idx].NAME}
        </a>
      </li>`;
    }

    el('DM_PROFILES_NAV').innerHTML = html;
    DM_TEMPLATE.lazyLoad();
  }

  function turnOffAccess() {
    toggleAccess(false);

    /*var app = DM_APPS.getInstalledApps()[0];
    if (app) {
      window.location = '#/' + app.LINK;
    }*/

    window.location = '#/dashboard_app'
  }

  function toggleAccess(setIsAccess) {

    // is access but it was not before
    if (setIsAccess && !isAccess) {
      toggleGroupSettings(true);
      DM_MAIN.getUserInfo();
      el('DM_ACCESS_HEADER').style.display = 'block';
      elq('.navbar').classList.add('mt-4');
      el('DM_MAIN_DIV').classList.add('mt-4');
      elq('#DM_PROFILE_IMAGE img').src = `${DM_CORE_CONFIG.BACKEND_URL}/functions.php/storage/avatar/${access_id}`;

      // remove access but was access before
    } else if (!setIsAccess && isAccess) {
      toggleGroupSettings(false);
      el('DM_ACCESS_HEADER').style.display = 'none';
      elq('.navbar').classList.remove('mt-4');
      el('DM_MAIN_DIV').classList.remove('mt-4');
      elq('#DM_PROFILE_DIV').innerHTML = `<span class="accessName">${auth.config.user}</span>`;
      elq('#DM_PROFILE_IMAGE').innerHTML = `<img class="rounded-circle" src="${DM_CORE_CONFIG.BACKEND_URL}/functions.php/storage/avatar/${auth.config.id}" onerror="this.src = 'https://cdn.dokume.net/img/logo/favicon/DokuMe_round_button.png'">`;
      /*elq('#DM_PROFILE_DIV img').src = `${DM_CORE_CONFIG.BACKEND_URL}/functions.php/storage/avatar/${auth.config.id}`;
      elq('#DM_PROFILE_DIV .accessName').innerHTML = auth.config.user;*/
      showApps(DM_APPS.getInstalledApps());

      checkOnboardingProgress();

      // set access but before diffrent group id
    } else if (setIsAccess && isAccess != access_id) {
      toggleGroupSettings(true);
      DM_MAIN.getUserInfo();
      elq('#DM_PROFILE_IMAGE img').src = `${DM_CORE_CONFIG.BACKEND_URL}/functions.php/storage/avatar/${access_id}`;
    }

    isAccess = access_id;

  }

  function toggleGroupSettings(isGroup) {
    if (isGroup) {
      el('DM_BACK_TO_PROFILE').style.display = 'block';
      el('DM_BACK_TO_PROFILE_DEVIDER').style.display = 'block';
      el('DM_SETTINGS_LINK').href = `#/${access_routingid}group_settings`;
      el('DM_SETTINGS_LINK').style.display = 'none';
      el('DM_MARKET_LINK').href = `#/${access_routingid}market`;
      el('DM_MARKET_LINK').style.display = 'none';

      if (!DM_CONFIG.STARTPAGE && DM_CORE_CONFIG.LANDING_URL === '#/dashboard_app') {
        elq('.navbar-brand').href = `#/${access_routingid}dashboard_app`;
        elq('.navbar-brand-sm').href = `#/${access_routingid}dashboard_app`;
      }
    } else {
      el('DM_BACK_TO_PROFILE').style.display = 'none';
      el('DM_BACK_TO_PROFILE_DEVIDER').style.display = 'none';
      el('DM_SETTINGS_LINK').href = `#/settings`;
      el('DM_SETTINGS_LINK').style.display = 'block';
      el('DM_MARKET_LINK').href = `#/market`;
      el('DM_MARKET_LINK').style.display = 'block';

      if (!DM_CONFIG.STARTPAGE && DM_CORE_CONFIG.LANDING_URL === '#/dashboard_app') {
        elq('.navbar-brand').href = '#/dashboard_app';
        elq('.navbar-brand-sm').href = '#/dashboard_app';
      }
    }
  }

  function initAppbar(data) {

    if (!data || data.length < 1) {
      el('mainContentHeader').innerHTML = '';
      return false;
    }

    var menu = '';

    for (var idx in data) {
      menu += `<a class="nav-link" href="${data[idx].LINK}">${data[idx].NAME}</a>`
    }

    el('mainContentHeader').innerHTML = `
      <nav class="navbar navbar-light bg-light">
        <div class="container-fluid">
            <div class="navbar-nav">
              ${menu}
            </div>
        </div>
      </nav>`;

    $('#mainContentHeader').i18n();

  }

  function startHelp(url, tourId, directStart) {

    if (el('mainContent').classList.contains('DM_FULLSCREEN')) return false;

    if (!directStart) {
      elq('#DM_INFO_MODAL .modal-header').style.display = 'flex';
      elq('#DM_INFO_MODAL .modal-image').classList.remove('d-flex');
      elq('#DM_INFO_MODAL .modal-title').innerHTML = i18next.t('faq.modal_headline');
      elq('#DM_INFO_MODAL .modal-image').innerHTML = '';
      elq('#DM_INFO_MODAL .modal-body').innerHTML = `
      <div id="DM_FAQ_PLUGIN">
      <div class="d-flex justify-content-center">
        <div class="spinner-border" role="status">
            <span class="visually-hidden">Loading...</span>
          </div>
        </div>
      </div>`;
      elq('#DM_INFO_MODAL .modal-footer').innerHTML = `<a href="#/help/index/${app_name}/${page_name}" class="btn btn-primary btn-block">${i18next.t('faq.support_center')}</a>`;

      $('#DM_INFO_MODAL').modal('show');
      DM_DOKUME_FAQ.bindEvents();
    }

    DM_DOKUME_FAQ.getFAQ(0, 0, url ? url : `${app_name}/${page_name}`, tourId, directStart);
  }

  // check if an app has an onboarding procedur
  function checkAppOnboarding(appURL, type) {
    if (!appURL) {
      return false;
    }

    var app = DM_APPS.findAppByURL(appURL);
    if (!app) {
      return false;
    }

    if (access_id) {

      // wait for accessinfo from the opened group
      if (!access_info) {
        setTimeout(function () {
          checkAppOnboarding(app_name, 1)
        }, 1000);
        return false;
      }

      var tour = access_info.AVAILABLE_TOURS.find(a => a.APP_ID == app.ID);

      if (tour) {

        var temp = DM_CONFIG.USER_TOUR_DONE.find(a => a.FAQ_TOUR_ID == tour.FAQ_TOUR_ID && a.DONE == 1 && a.IN_GROUP == 1);

        if (temp) {
          tour = null;
        }

        //checkGroupTours(app, access_info.AVAILABLE_TOURS);
      }
    } else {
      var tour = DM_CONFIG.USER_TOUR_DONE.find(a => a.APP_ID == app.ID && a.DONE == 0 && a.IN_GROUP == 0);
    }

    if (tour) {

      if (el('mainContent').classList.contains('DM_FULLSCREEN')) return false;

      elq('#DM_INFO_MODAL .modal-header').style.display = 'none';
      elq('#DM_INFO_MODAL .modal-image').classList.add('d-flex');
      elq('#DM_INFO_MODAL .modal-image').style.backgroundImage = `url(https://gos3.io/dokume-storage/user-13199/storage/127696.jpeg)`;
      elq('#DM_INFO_MODAL .modal-image').innerHTML = `
      <h3 class="align-self-center flex-fill text-center" data-i18n="DM_TOUR.title_5">${app.NAME001}</h3>
      <button type="button" class="btn-close btn-close-white align-self-start" data-bs-dismiss="modal" aria-label="Close"></button>`;

      //elq('#DM_INFO_MODAL .modal-title').innerHTML = app.NAME001;
      elq('#DM_INFO_MODAL .modal-body').innerHTML = `
      ${app.DESCRIPTION ? app.DESCRIPTION : ''}
      
      <p>Möchtest Du bei dieser App begleitet werden? Schritt für Schritt Anleitung starten.</p>`;

      elq('#DM_INFO_MODAL .modal-footer').innerHTML = `
      <div class="d-grid gap-2 mt-3 w-100">
        <button class="btn btn-lg btn-primary" onclick="DM_TEMPLATE_UI.startHelp('0', ${tour.FAQ_TOUR_ID}, 1);DM_CORE.updateUserTour(${tour.ID}, 1);">Ja</button>
        <button class="btn btn-sm btn-outline-primary" onclick="DM_CORE.updateUserTour(${tour.ID}, 1);$('#DM_INFO_MODAL').modal('hide');">Nein</button>
      </div>`;

      $('#DM_INFO_MODAL').modal('show');
    }
  }

  // save available undone group tour
  function checkGroupTours(app, tours) {
    var groupTour = tours.find(a => a.APP_ID == app.ID);
    if (!groupTour) return false;

    backend.saveObject(454, null, groupTour, function (data) {
      if (data.SUCCESS !== true) return false;

      DM_CONFIG.USER_TOUR_DONE.push(groupTour);
      checkAppOnboarding(app_name, 2);
    }, 1);
  }

  function checkOnboardingProgress() {

    el('onboardingProgressDIV').innerHTML = '';

    if (!DM_CONFIG.USER_TOUR_DONE) return false;

    var undoneTours = [];

    if (!access_id) {
      undoneTours = DM_CONFIG.USER_TOUR_DONE.filter(a => a.FAQ_TOUR_ID != null && a.DONE != 1 && a.IN_GROUP != 1);
    } else if (access_info && access_info.AVAILABLE_TOURS) {

      for (var idx in access_info.AVAILABLE_TOURS) {
        var temp = DM_CONFIG.USER_TOUR_DONE.find(a => a.FAQ_TOUR_ID != null && a.FAQ_TOUR_ID == access_info.AVAILABLE_TOURS[idx].FAQ_TOUR_ID && a.DONE == 1 && a.IN_GROUP == 1);

        if (!temp) {
          undoneTours.push(access_info.AVAILABLE_TOURS[idx]);
        }
      }

    }

    if (undoneTours.length < 1) return false;

    if (!access_id) {
      var totalTours = DM_CONFIG.USER_TOUR_DONE.filter(a => a.FAQ_TOUR_ID != null && a.IN_GROUP != 1 && (a.APP_ID || a.FAQ_TOUR_ID == 5));
    } else {
      var totalTours = access_info.AVAILABLE_TOURS.filter(a => a.FAQ_TOUR_ID != null);
    }

    console.log({ undoneTours }, { totalTours });

    el('onboardingProgressDIV').innerHTML = `
    <a href="#/${access_routingid}onboarding/progress" class="btn btn-light btn-circle loggedInOnly">
      <img src="https://app.commitly.com/assets/images/monsters/progress2.png">
      <span class="badge rounded-pill ${access_id ? 'bg-primary' : 'bg-danger'}">${parseInt(100 - (undoneTours.length / totalTours.length * 100))} %</span>
    </a>`;
  }

  function checkProjectTimer() {
    el('projectTimerDIV').innerHTML = '';

    backend.getObject(283, null, {
      shared: true,
      fields: {
        type: 'count',
        fields: ['END_DATE'],
        userSpecific: false
      },
      where: [{
        key: 'END_DATE',
        operator: 'is',
        value: null
      }, {
        key: 'CREATOR_ID',
        operator: 'is',
        value: auth.config.id
      }]
    }, function (data) {
      if (data.SUCCESS !== true) return false;

      data = data.MESSAGE.OWN.concat(data.MESSAGE.SHARED);
      var totalTimer = 0;

      for (var idx in data) {
        totalTimer += parseInt(data[idx].COUNT);
      }

      if (totalTimer == 0) {
        el('openNotificationBTN').classList.add('btn-light');
        el('openNotificationBTN').classList.remove('btn-warning');
        return false;
      }

      /*el('projectTimerDIV').innerHTML = `
      <a href="#/timetracking/active_timer" class="btn btn-light btn-circle loggedInOnly position-relative">
        <i class="bi bi-stopwatch"></i>
        <span class="position-absolute top-0 start-100 translate-middle badge rounded-pill bg-danger">
        ${totalTimer}
          <span class="visually-hidden">unread messages</span>
        </span>
      </a>`;*/
      el('projectTimerDIV').innerHTML = `
      <a href="#/timetracking/active_timer">
        <div class="alert alert-warning">
          <i class="bi bi-stopwatch"></i>
          Du hast ${totalTimer} aktive Timer.
        </div>
      </a>`;

      el('openNotificationBTN').classList.remove('btn-light');
      el('openNotificationBTN').classList.add('btn-warning');
    }, 1);
  }

  function checkWhitelabel() {
    if (DM_CORE_CONFIG.DOKUME_PLATFORM === 'app' || subdomain == 127 || !DM_CONFIG.WHITELABEL && subdomain == 'my' || DM_CONFIG.WHITELABEL === subdomain) return false;

    el('DM_MAIN_DIV').insertAdjacentHTML('beforeend', `
    <div id="whitelabelInfo" class="offcanvas offcanvas-bottom" tabindex="-1" aria-labelledby="offcanvasLabel" style="height:210px">
      <div class="offcanvas-header d-none d-sm-flex">
        <h5 class="offcanvas-title">${transCls.i18Return('basic', 'whitelabelInfoTitle', 'Wähle deine Plattform')}</h5>
        <button type="button" class="btn-close" data-bs-dismiss="offcanvas" aria-label="Close"></button>
      </div>
      <div class="offcanvas-body">
        ${DM_CONFIG.WHITELABEL ? `
        <p>
        ${transCls.i18Return('basic', 'saveNewWhitelabel1', 'Du hast Dich auf')} ${subdomain}.dokume.net ${transCls.i18Return('basic', 'saveNewWhitelabel3', 'eingeloggt. In deinem Konto ist')} "${DM_CONFIG.WHITELABEL}.dokume.net" ${transCls.i18Return('basic', 'saveNewWhitelabel4', 'hinterlegt.<br>Möchtest Du jetzt zu deinem DokuMe wechseln?')}
        </p>

        <a href="https://${DM_CONFIG.WHITELABEL}.dokume.net${document.location.hash !== '' ? document.location.hash : ''}" class="btn btn-primary">${transCls.i18Return('basic', 'whitelabelInfoChangeBtn', 'Jetzt wechseln')}</a>
        <button id="changeWhitelabelBTN" class="btn btn-outline-secondary" data-bs-dismiss="offcanvas" data-bs-dismiss="offcanvas">${transCls.i18Return('basic', 'whitelabelInfoStayBtn', 'Hier bleiben')}</button>
        ` : `
        <p>
          ${transCls.i18Return('basic', 'saveNewWhitelabel1', 'Du hast Dich auf')} ${subdomain}.dokume.net ${transCls.i18Return('basic', 'saveNewWhitelabel2', 'eingeloggt. In deinem Konto ist diese Plattform noch nicht hinterlegt.<br>Möchtest Du die Einstellung jetzt in deinem Konto speichern?')}
        </p>

        <button id="changeWhitelabelBTN" class="btn btn-primary" data-bs-dismiss="offcanvas">${transCls.i18Return('basic', 'whitelabelInfoSaveBtn', 'Jetzt speichern')}</button>
        <button class="btn btn-outline-secondary" data-bs-dismiss="offcanvas">${transCls.i18Return('basic', 'no', 'Nein')}</button>`}
      </div>
    </div>`);

    var info = new bootstrap.Offcanvas('#whitelabelInfo');
    info.show();

    el('changeWhitelabelBTN').addEventListener('click', function() {
      backend.saveObject(2, auth.config.id, {
        WHITELABEL: subdomain != 'my' && subdomain != 127 ? subdomain : null
      }, function(data) {
        if (!util.errorHandler(data, 1)) return false;
  
        if (DM_CONFIG.WHITELABEL) {
          location.reload();
        }
      }, 1);
    })
  }

  return { init, initTemplate, initAppbar, showApps, showGroups, startHelp, checkOnboardingProgress, checkProjectTimer }

})();