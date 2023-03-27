'use strict';

var DM_TEMPLATE = (function () {

  var notificationDIV = el('DokuMe-Notifications');
  var notificationBar = el('systemNotificationBar');
  var mainsearchbox = null;
  var lazyLoadInstance = null;
  var isInitTemplate = false;

  var notificationOffcanvasElement = document.getElementById('offcanvas');
  var notificationOffcanvas = new bootstrap.Offcanvas(notificationOffcanvasElement);

  function init() {

    if (isInitTemplate) {
      return false;
    }

    isInitTemplate = true;

    bindEvents();
    initNotification();


    lazyLoadInstance = new LazyLoad({
      elements_selector: '.lazy',
      callback_error: (img) => {
        img.setAttribute("src", "https://cdn.dokume.net/img/logo/favicon/DokuMe_round_button.png");
      }
    });

    if (subdomain === 'fil') return false;

    mainsearchbox = new SearchBox({
      url: 'class/search.php?term=',
      element: '#searchbox',
      trigger: '#DokuMeSearch',
      placeholder: 'index.search',
      resultID: 'coreSearchVal',
      successHandler: function (data) {
        //console.log(data);
        var redirect = '#/';
        if (isGroup == 1) {
          redirect += 'admin/' + data.value + '/';
          redirect += (admin_id) ? admin_id : access_id;
        } else {
          redirect += 'access/' + data.value;
        }
        window.location = redirect;

        toggleSearch();
      },
      errorHandler: function () {
        window.location = '#/onboarding/invite'
      },
      closeHandler: toggleSearch,
      errorText: '<h4>Person nicht gefunden. schade</h4> <span>Hier klicken, um <b><i>{searchString}</i></b> zu DokuMe einzuladen.</span>'
    }, function () {
      //$('.dokume-search').i18n();
    });

  }

  function bindEvents() {
    el('DokuMeSearch').addEventListener('click', toggleSearch);
    el('closeSearchBTN').addEventListener('click', toggleSearch);
  }

  function toggleSearch() {
    el('controllWrapper').classList.toggle('d-flex');
    el('searchWrapper').classList.toggle('d-flex');
    $('#DM_NAVBAR .navbar-toggler').parent().toggle();
    elq('#searchWrapper [type="search"]').focus();
  }

  function lazyLoad() {
    lazyLoadInstance.update();
  }

  function initNotification() {

    if (typeof socket === 'undefined' || !socket) {
      setTimeout(initNotification, 100);
      return false;
    }

    socket.readyFKT(DM_NOTIFICATIONS.getAmountNotificaiton);
    bindEventsNotification();
  }

  function bindEventsNotification() {

    el('openNotificationBTN').addEventListener('click', function () {
      notificationOffcanvas.toggle();
    });

    $('#offcanvas .scrollarea, #projectTimerDIV').on('click', 'a', function (e) {
      notificationOffcanvas.hide();
    });

    el('openNotificationCenterBTN').addEventListener('click', function () {
      notificationOffcanvas.hide();
    });

    $('#offcanvas .scrollarea').on('click', '[data-removenotification]', function (e) {
      e.stopImmediatePropagation();
      e.stopPropagation();
      e.preventDefault();

      socket.deleteNotification(this.dataset.removenotification);
    });

    $('#offcanvas .scrollarea').on('click', '[data-removenotificationgroup]', function (e) {
      e.stopImmediatePropagation();
      e.stopPropagation();
      e.preventDefault();

      socket.deleteNotificationGroup(this.dataset.removenotificationgroup);
    });

    $('#offcanvas .scrollarea').on('click', '[data-shownotificationgroup]', function (e) {
      if (this.dataset.isloaded != 0) return true;

      e.stopImmediatePropagation();
      e.stopPropagation();
      e.preventDefault();

      var btn = this;
      DM_NOTIFICATIONS.getGroupedNotifications(this.dataset.shownotificationgroup, function (data) {
        showNotificationGroup(data, btn);
      });
    });

    $('#offcanvas').on('click', '.loadMoreNotificationsBTN', function () {
      DM_NOTIFICATIONS.changeStartIdx(50);
      DM_NOTIFICATIONS.getNotifications(true);
    });
  }

  function showNotificationGroup(data, btn) {

    var html = '';

    for (var idx in data.MESSAGE) {
      var notification = data.MESSAGE[idx];

      if (!notification.message) {
        return false;
      }

      var msg = notification.message;

      if (typeof msg === 'string') {
        msg = JSON.parse(notification.message);
      }
      var url = notification.url;
      if (notification.type == 4) {
        url = 'routines/detail/' + notification.url;
      }/* else if (data.type === 'message') {
        url = 'chat/index/' + msg.chat_id;
      }*/
      if (notification.subject == 'new_ticket_comment') {
        notification.subject = 'Neuer Kommentar';
        msg = 'Du hast einen neuen Kommentar in deiner Notiz';
        url = data.url;
      }
      if (notification.subject == 'new_ticket') {
        notification.subject = 'Neue Notiz';
        msg = 'Du wurdest in einer Notiz erwähnt';
        url = notification.url;
      }
      html += `
      <a href="#/${url}" class="notification list-group-item list-group-item-action py-3 lh-tight">
        <div class="d-flex w-100 align-items-center justify-content-between">
          <img class="img-circle lazy" data-src="${DM_CORE_CONFIG.BACKEND_URL}/functions.php/storage/avatar/${notification.creator_id}">
  
          <button class="btn btn-transparent remove" data-removenotification="${notification.id}"><i class="fa fa-times"></i></button>
        </div>
        <div class="d-flex w-100 align-items-center justify-content-between">
          <strong class="mb-1">${i18next.t(notification.subject)}</strong>
          <small class="text-muted">
          ${moment(notification.date_created).fromNow()}
          </small>
        </div>
        <div class="col-10 mb-1 small">
          ${typeof msg === 'object' ? `${msg.message}<br><small><i>${msg.name}</i></small>` : msg}
        </div>
      </a>`;
    }

    btn.innerHTML = html;
    btn.dataset.isloaded = 1;

    DM_TEMPLATE.lazyLoad();
  }

  function addNotification(data) {

    if (!data.message) {
      return false;
    }

    var msg = data.message;

    if (typeof msg === 'string') {
      msg = JSON.parse(data.message);
    }
    var url = data.url;
    if (data.type == 4) {
      url = 'routines/detail/' + data.url;
    }/* else if (data.type === 'message') {
      url = 'chat/index/' + msg.chat_id;
    }*/
    if (data.subject == 'new_ticket_comment') {
      data.subject = 'Neuer Kommentar';
      msg = 'Du hast einen neuen Kommentar in deiner Notiz';
      url = data.url;
    }
    if (data.subject == 'new_ticket') {
      data.subject = 'Neue Notiz';
      msg = 'Du wurdest in einer Notiz erwähnt';
      url = data.url;
    }

    var notification = `
    <a href="#/${url}" class="notification list-group-item list-group-item-action py-3 lh-tight">
      <div class="d-flex w-100 align-items-center justify-content-between">
        <img class="img-circle lazy" data-src="${DM_CORE_CONFIG.BACKEND_URL}/functions.php/storage/avatar/${data.creator_id}">

        <button class="btn btn-transparent remove" ${data.amount > 1 ? `data-notificationamount=${data.amount} data-removenotificationgroup` : 'data-removenotification'}="${data.id}"><i class="fa fa-times"></i></button>
      </div>
      <div class="d-flex w-100 align-items-center justify-content-between">
        <strong class="mb-1">${i18next.t(data.subject)}</strong>
        <small class="text-muted">
        ${moment(data.date_created).fromNow()}
        </small>
      </div>
      <div class="col-10 mb-1 small">
        ${typeof msg === 'object' ? `${msg.message}<br><small><i>${msg.name}</i></small>` : msg}
      </div>
      <div class="col-12 mb-1 small"><small>${data.amount > 1 ? `<div data-shownotificationgroup="${data.id}" data-isloaded="0"><i class="bi bi-caret-right"></i>${data.amount - 1} weitere Benachrichtigungen</div>` : ''}</div>
    </a>`;

    elq('#offcanvas .scrollarea').insertAdjacentHTML('beforeend', notification);
    lazyLoad();
  }

  function showSystemNotification(type, text, callback) {
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

    el('DM_LIVE_TOAST_WRAPPER').innerHTML = `
    <div id="liveToast" class="toast ${colorClass}" role="alert" aria-live="assertive" aria-atomic="true">
      
      <!--<div class="toast-header">
        <!--<img src="..." class="rounded me-2" alt="...">
        <strong class="me-auto">Bootstrap</strong>
        <small>11 mins ago</small>
      </div>-->
      <div class="toast-body">
        <button type="button" class="btn-close btn-close-white pull-right" data-bs-dismiss="toast" aria-label="Close"></button>
        ${text}
        
        ${callback ? `<div class="mt-2 pt-2 border-top">
          <button id="DM_TOAST_ACTION_BTN" type="button" class="btn btn-secondary btn-sm" data-bs-dismiss="toast" aria-label="Close">Mehr Info</button>
        </div>` : ''}
      </div>
    
    </div>`;

    if (callback) {
      el('DM_TOAST_ACTION_BTN').addEventListener('click', callback)
    }

    var toastLiveExample = document.getElementById('liveToast')
    var toast = new bootstrap.Toast(toastLiveExample)

    toast.show()
  }

  var systemNotification = null;

  function showSystemNotification2(type, text, callback) {
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


  $('#systemNotificationDIV').on('animationend', '.dm_notification', function () {
    if (!this.classList.contains('bounceInDown')) $(this).remove()
  })
  $('#systemNotificationDIV').on('click', '.closeBTN', function () {
    $(this).closest('.dm_notification').removeClass('bounceInDown');
    $(this).closest('.dm_notification').addClass('fadeOut');
  })

  function setDesign(data) {
    if (!data) return false;

    if (data == '0') {
      elq('[data-bs-theme]').dataset.bsTheme = 'dark';
    } else {
      elq('[data-bs-theme]').dataset.bsTheme = 'light';
    }
  }

  function showLoader(selector, type, size) {
    if (type == 1) {
      elq(selector).innerHTML = `
      <tr>
        <td class="placeholder-glow" colspan="${size ?? 4}">
          <span class="placeholder col-7"></span>
          <span class="placeholder col-4"></span>
          <span class="placeholder col-4"></span>
          <span class="placeholder col-7"></span>
          <span class="placeholder col-4"></span>
          <span class="placeholder col-3"></span>
          <span class="placeholder col-8"></span>
        </td>
      </tr>`;
    } else {
      elq(selector).innerHTML = `
      <div class="placeholder-glow" style="grid-column: span ${size ?? 3}; ">
        <span class="placeholder col-7"></span>
        <span class="placeholder col-4"></span>
        <span class="placeholder col-4"></span>
        <span class="placeholder col-6"></span>
        <span class="placeholder col-8"></span>
      </div>`
    }
  }

  function showBtnLoader(btn, show) {
    if (show) {
      btn.disabled = true;
      btn.insertAdjacentHTML('afterbegin', '<span class="spinner-border spinner-border-sm me-2" role="status" aria-hidden="true"></span>');
    } else {
      btn.getElementsByClassName('spinner-border')[0].remove();
      btn.disabled = false;
    }
  }

  return {
    init: init,
    showPage: showPage,
    addNotification: addNotification,
    showSystemNotification: showSystemNotification,
    lazyLoad: lazyLoad,
    showLoader, showLoader,
    showBtnLoader: showBtnLoader,
    setDesign: setDesign
  };

})();


function createPicker(selector, time, date, humanFriendly, defaultDate) {
  if (!time) time = false;
  if (!date) date = false;

  var options = {
    enableTime: time,
    noCalendar: date,
    locale: 'de',
    time_24hr: true
  };

  if (humanFriendly) {
    options.altInput = true;
    options.altFormat = 'j. F Y';
    options.dateFormat = 'Y-m-d';
  }
  if (defaultDate) {
    options.defaultDate = defaultDate;
  }
  var picker = new flatpickr(selector, options);

  return picker;
}

function showPage(selector) {
  $('.pagetoggle').hide();
  $(selector).show();
}

function el(id) {
  var el = document.getElementById(id);
  if (!el) {
    return returnFallback(id);
  }
  return el;
}

function elq(selector) {
  var el = document.querySelector(selector);
  if (!el) {
    return returnFallback(selector);
  }
  return el;
}

function returnFallback(selector) {
  //throw new ReferenceError(id + " is not defined");
  return {
    fallBackElement: true,
    value: '',
    innerHTML: '',
    style: {
      display: ''
    },
    insertAdjacentHTML: function () {
      console.warn(selector + " is not defined");
    },
    addEventListener: function () {
      console.warn(selector + " is not defined");
    },
    classList: {
      add: function () {
        console.warn(selector + " is not defined");
      },
      remove: function () {
        console.warn(selector + " is not defined");
      }
    },
    dataset: {},
    notExisting: true,
    reset: function () {
      console.warn(selector + " is not defined");
    },
    getContext: function () {
      console.warn(selector + " is not defined");
    }
  }
}
