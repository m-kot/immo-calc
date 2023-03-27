(function() {
  'use strict';

  var DokuMe_Auth = function(url) {

    this.URL = url;
    this.loggedIn = null;
    this.config = null;
    this.language = (localStorage.getItem('language')) ? localStorage.getItem('language') : null

    var authConfig = localStorage.getItem('authConfig');
    if (authConfig) {
      try {
        authConfig = JSON.parse(atob(authConfig));
      } catch (e) {

        try {
          authConfig = JSON.parse(authConfig);
        } catch (e2) {
          alert('Der Login ist abgelaufen. Bitte melden Sie sich erneut an.');
        }
      }
    }

    this.config = {
      token: (authConfig && authConfig.token) ? authConfig.token : null,
      refresh: (authConfig && authConfig.refresh) ? authConfig.refresh : null,
      id: (authConfig && authConfig.id) ? authConfig.id : null,
      user: (authConfig && authConfig.user) ? authConfig.user : null
    };

  };

  DokuMe_Auth.prototype.login = function(alias, pass, callback) {
    var _ = this;

    $.ajax({
      url: _.URL + 'functions.php/oauth2/login',
      type: 'POST',
      data: {
        username: alias,
        password: pass,
        invite: null,
        LANG: navigator.language,
        grant_type: 'password'
      },
      beforeSend: function(xhr) {
        xhr.setRequestHeader('Authorization', 'Basic ' + btoa('dokume:dokumepasswort'));
      }
    }).done(function(data) {

      if (data.access_token) {
        _.loggedIn = true;
        
        _.config = {
          token: data.access_token,
          refresh: data.refresh_token,
          id: data.ID,
          user: encodeURIComponent(data.NAME)
        };

        localStorage.setItem('authConfig', btoa(JSON.stringify(_.config)));
        localStorage.setItem('language', data.LANGUAGE);

        _.executeCallback(callback, data, 'login');
      } else {
        _.executeCallback(callback, data, 'login');
      }

    }).fail(function(data) {
      _.executeCallback(callback, JSON.parse(data.responseText), 'loginfail');
    });

  };

  DokuMe_Auth.prototype.refresh_token = function(callback) {
    var _ = this;

    $.ajax({
      url: _.URL + 'functions.php/oauth2/token',
      type: 'POST',
      data: {
        grant_type: 'refresh_token',
        refresh_token: _.config.refresh
      },
      beforeSend: function(xhr) {
        xhr.setRequestHeader('Authorization', 'Basic ' + btoa('dokume:dokumepasswort'));
      }
    }).done(function(data) {
      if (!data.access_token) {
        _.executeCallback(callback, false, 'refresh_token');
        return false;
      }

      _.loggedIn = true;
      _.config.token = data.access_token;
      _.config.refresh = data.refresh_token;

      localStorage.setItem('authConfig', btoa(JSON.stringify(_.config)));

      /*if (typeof(socket) !== 'undefined' && socket.ws) {
        socket.ws.refresh();
      }*/

      _.executeCallback(callback, data, 'refresh_token');

    }).fail(function(data) {
      _.executeCallback(callback, false, 'refresh_token');
    });
  };

  DokuMe_Auth.prototype.logout = function(callback) {
    var _ = this;

    $.post(_.URL + 'functions.php/oauth2/logout', {
      token: _.config.token,
      refresh: _.config.refresh
    }, function(data) {

      _.loggedIn = null;
      _.config = {
        token: null,
        refresh: null,
        id: null,
        user: null,
        language: null
      };

      localStorage.clear();

      _.executeCallback(callback, data, 'refresh_token');
    });
  };


  DokuMe_Auth.prototype.resendConfirmationMail = function(email, callback) {

    var _ = this;

    $.ajax({
      //url: 'https://backend.dokume.us/functions.php/registration/passwordReset',
      url: _.URL + 'functions.php/registration/email/resend',
      type: 'POST',
      data: JSON.stringify({
        email: email
      })
    }).done(function(data) {

      _.executeCallback(callback, data, 'resendConfirmationMail');
    });

    /*backend.saveFunction('registration/email/resend', {
      email: email
    }, function(data) {
      if (!util.errorHandler(data)) return false;

      DM_TEMPLATE.showSystemNotification(2, 'Wir haben die eine neue Bestätigungsmail zugeschickt.');
    });*/
  };

  /*
   * check if callback is defined, else console info
   */
  DokuMe_Auth.prototype.executeCallback = function(callback, data, name) {
    if (typeof callback === 'function') {
      callback(data);
    } else {
      console.info('Define callback for ' + name);
    }
  };

  //expose DokuMe_Auth to window
  window.DokuMe_Auth = DokuMe_Auth;
})();
