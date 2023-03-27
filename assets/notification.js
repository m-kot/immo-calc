var DM_NOTIFICATIONS = function () {

  var notifications = [];
  var amountNotifications = 0;
  var amountChatNotifications = 0;

  var AMOUNT_NOTIFICATION = 0;
  var AMOUNT_NOTIFICATION_PAGING = 0;
  var START_IDX = 0;

  init();

  function init() {

    DM_PUBSUB.on('showNotification', function (data) {
      showNotification(data, true);
    });
    DM_PUBSUB.on('deleteNotification', deleteNotification);
    DM_PUBSUB.on('deleteNotificationGroup', deleteNotificationGroup);
    DM_PUBSUB.on('deleteAllNotification', deleteAllNotification);
    DM_PUBSUB.on('deleteChatMessage', deleteChatMessageNotification);
    DM_PUBSUB.on('editChatMessage', editChatMessageNotification);
  }

  function changeStartIdx(change) {
    START_IDX += change;
  }

  function getNotifications(index) {

    if (!socket) return false;

    socket.sendMsg({
      type: 'moreGrouped',
      startIdx: index === true ? START_IDX : 0,
      direction: 'desc'
    }, 'list', 'notification', function (data) {
      if (data.SUCCESS !== true) return false; //notifications = data.MESSAGE;

      amountNotifications = 0;
      amountChatNotifications = 0;
      notifications = [];

      if (index !== true) {

        elq('#offcanvas .list-group').innerHTML = '';

        if (data.MESSAGE.length === 50) {
          elq('#offcanvas .loadMoreNotificationsBTN').style.display = 'block';
        } else {
          elq('#offcanvas .loadMoreNotificationsBTN').style.display = 'none';
        }
      } else if (data.MESSAGE.length < 1) {
        START_IDX -= 50;
      }

      for (var idx in data.MESSAGE) {
        showNotification(data.MESSAGE[idx], false);
      }

      DM_TEMPLATE.lazyLoad();

      DM_PUBSUB.emit('websocketnotification', notifications);
    });


    /*socket.sendMsg(null, "list", "notification", function(data) {
      if (data.SUCCESS !== true) return false; //notifications = data.MESSAGE;

      amountNotifications = 0;
      amountChatNotifications = 0;
      notifications = [];
      $('#DokuMe-Notifications ul').empty();

      for (var idx in data.MESSAGE) {
        showNotification(data.MESSAGE[idx]);
      }

      DM_PUBSUB.emit('websocketnotification', notifications);
    });*/
  }

  function showNotification(data, isNewNotification) {

    switch (data.type) {
      /*case '1':
        if (data.url == '#/onboarding/confirm') {
          $('.pull-right').remove();
          $('#leftSidebar .mainMenu').prepend('<a href="#/onboarding/confirm"><div class="alert alert-warning" role="alert"> <strong>Bestätige bitte deine Email Adresse!</strong></div></a>');
          if (page_name == 'onboarding') return false;
        }

        window.location = data.url.includes('#') ? data.url : '#' + data.url;
        break;*/

      /*case '3':
        $('.pull-right').remove();
        $('#leftSidebar .mainMenu').prepend('<a href="#/onboarding/confirm"><div class="alert alert-warning" role="alert"> <strong>Bestätige bitte deine Email Adresse!</strong></div></a>');
        $('#hauptmenu').remove();
        if (page_name == 'onboarding') return false;
        window.location = data.url.includes('#') ? data.url : '#' + data.url;
        break;*/

      case 'event':
        DM_PUBSUB.emit('event', data);
        break;

      default:
        notifications.push(data);
        
        DM_TEMPLATE.addNotification(data, isNewNotification);
        if (data.message) {
          //setAmountNotification(true, data.type);
        }
        break;
    }
  }

  function getAmountNotificaiton() {
    if (!socket) return false;

    socket.sendMsg({
      type: 'countGrouped'
    }, 'list', 'notification', function (data) {

      if (data.MESSAGE.COUNT > 0) {

        if (data.MESSAGE.COUNT == AMOUNT_NOTIFICATION && data.MESSAGE.COUNT_PAGING == AMOUNT_NOTIFICATION_PAGING) return false;
        
        AMOUNT_NOTIFICATION = parseInt(data.MESSAGE.COUNT);
        AMOUNT_NOTIFICATION_PAGING = parseInt(data.MESSAGE.COUNT_PAGING);

        $('.DM_NOTIFICATION_AMOUNT').html(AMOUNT_NOTIFICATION);
        document.title = '(' + AMOUNT_NOTIFICATION + ') ' + DM_CORE_CONFIG.PLATFORM_NAME;
        getNotifications();
      } else {
        $('.DM_NOTIFICATION_AMOUNT').html('');
        document.title = DM_CORE_CONFIG.PLATFORM_NAME;
      }
    })
  }

  function setAmountNotification(increment, type) {
    if (increment) {
      amountNotifications++;

      if (type && type === 'message') {
        amountChatNotifications++;
      }

    } else {
      amountNotifications--;

      if (type && type === 'message') {
        amountChatNotifications--;
      }
    }

    if (notifications.length > 0) {
      $('.DM_NOTIFICATION_AMOUNT').html(notifications.length);
      document.title = '(' + notifications.length + ') ' + DM_CORE_CONFIG.PLATFORM_NAME;
    } else {
      $('.DM_NOTIFICATION_AMOUNT').html('');
      document.title = DM_CORE_CONFIG.PLATFORM_NAME;
    }

    showAmountChatMessages();
  }

  function showAmountChatMessages() {

    if (amountChatNotifications > 0) {
      $('[data-i18n="menu.chat"]').html(i18next.t('menu.chat') + ' (' + amountChatNotifications + ')');
    } else {
      $('[data-i18n="menu.chat"]').html(i18next.t('menu.chat'));
    }
  }

  function getNotificationsByType(type) {
    var data = notifications.filter(function (notification) {
      return notification.type == type;
    });
    return data;
  }

  function getNotificationsAmount() {
    return notifications.length;
  }

  function getGroupedNotifications(notificationId, callback){
    socket.sendMsg({
      type: 'group',
      id:notificationId
    }, 'list', 'notification', callback)
  }

  function deleteNotification(data) {
    notifications = notifications.filter(function (notification) {
      if (notification.id == data && notification.type === 'message') {
        amountChatNotifications--;
      }

      return notification.id != data;
    });

    var $notificationObj = $('[data-removenotification="' + data + '"]').closest('.notification');

    if ($notificationObj.length > 0) {
      $notificationObj.remove();
      AMOUNT_NOTIFICATION--;
      $('.DM_NOTIFICATION_AMOUNT').html(AMOUNT_NOTIFICATION);

      //setAmountNotification(false);
      document.title = '(' + AMOUNT_NOTIFICATION + ') ' + DM_CORE_CONFIG.PLATFORM_NAME;
    }
  }
  
  function deleteNotificationGroup(data) {
    notifications = notifications.filter(function (notification) {
      if (notification.id == data && notification.type === 'message') {
        amountChatNotifications--;
      }

      return notification.id != data;
    });

    var $notificationObj = $('[data-removenotificationgroup="' + data + '"]');
    var groupAmount = $notificationObj.data('notificationamount');
    $notificationObj = $notificationObj.closest('.notification');

    if ($notificationObj.length > 0) {
      $notificationObj.remove();
      AMOUNT_NOTIFICATION -= groupAmount;
      AMOUNT_NOTIFICATION_PAGING--;
      $('.DM_NOTIFICATION_AMOUNT').html(AMOUNT_NOTIFICATION);

      //setAmountNotification(false);
      document.title = '(' + AMOUNT_NOTIFICATION + ') ' + DM_CORE_CONFIG.PLATFORM_NAME;
    }
  }

  function deleteAllNotification() {
    notifications = [];
    amountChatNotifications = 0;
    $('.notification').remove();
    //setAmountNotification(false);
    AMOUNT_NOTIFICATION = 0;
    elq('#showNotification .fa-globe').innerHTML = '<span class="DokuMe-badge animated flash">' + AMOUNT_NOTIFICATION + '</span>';
    document.title = '(' + AMOUNT_NOTIFICATION + ') ' + DM_CORE_CONFIG.PLATFORM_NAME;
  }

  function deleteChatMessageNotification(data) {
    $(`[data-removenotification="${data.notification_id}"]`).closest('li').remove();
    setAmountNotification(false, 'message');
    AMOUNT_NOTIFICATION--;
  }

  function editChatMessageNotification(data) {
    $(`[data-removenotification="${data.id}"]`).closest('li').remove();
    DM_TEMPLATE.addNotification(data);
  }

  function notifyUser(text) {
    if (!window.Notification) {
      console.log('Browser does not support notifications.');
    } else {

      if (!document.hasFocus()) {
        return false;
      }

      // check if permission is already granted
      if (Notification.permission === 'granted') {
        // show notification here

        text = text.replace(/<[^>]+>/g, '');

        try {
          var notify = new Notification('DokuMe - Benachrichtigung!', {
            body: text,
            icon: 'https://cdn.dokume.net/img/logo/favicon/DokuMe_round_button.png'
          });

          notify.addEventListener('click', function () {
            el('showNotification').click();
          });
        } catch (e) {
          if (e.name == 'TypeError') {
            return false;
          }
        }

      } else {
        // request permission from user


        try {
          Notification.requestPermission()
            .then((p) => notifyUserUserCallback(p, text))
        } catch (error) {
          // Safari doesn't return a promise for requestPermissions and it
          // throws a TypeError. It takes a callback as the first argument
          // instead.
          if (error instanceof TypeError) {
            Notification.requestPermission((p) => {
              notifyUserUserCallback(p, text);
            });
          } else {
            throw error;
          }
        }



        /*Notification.requestPermission().then(notifyUserUserCallback).catch(function(err) {
          console.error(err);
        });*/
      }
    }
  }

  function notifyUserUserCallback(p, text) {
    if (p === 'granted') {
      // show notification here

      text = text.replace(/<[^>]+>/g, '');

      try {
        var notify = new Notification('DokuMe - Benachrichtigung!', {
          body: text,
          icon: 'https://cdn.dokume.net/img/logo/favicon/DokuMe_round_button.png'
        });
      } catch (e) {
        if (e.name == 'TypeError') {
          return false;
        }
      }
    } else {
      console.log('User blocked notifications.');
    }
  }
  /*function notifyUser(data) {
    var json = JSON.parse(data.message);
    var info = json.message || json;
    DM_TEMPLATE.showSystemNotification(1, info);
     var myFunction = function() {
      window.location = '#/chat';
    };
     var myImg = 'https://test.dokume.net/platform/img/DokuMe_Logo_pencil_black.svg';
    var options = {
      title: 'DokuMe Benachrichtigung',
      options: {
         body: json.message || json,
        icon: myImg,
        lang: 'de-DE',
        onClick: myFunction
      }
    };
     $("#easyNotify").easyNotify(options);
    notifications.push(data);
  }*/

  return {
    getAmountNotificaiton: getAmountNotificaiton,
    getNotifications: getNotifications,
    getNotificationsByType: getNotificationsByType,
    getNotificationsAmount: getNotificationsAmount,
    notifyUser: notifyUser,
    showAmountChatMessages: showAmountChatMessages,
    changeStartIdx: changeStartIdx,
    getGroupedNotifications:getGroupedNotifications
  };
}();
