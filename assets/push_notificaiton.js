'use strict';

var DM_PUSHNOTIFICATION = (function() {

  var messaging = null;
  var FCM_TOKEN = null;

  var firebaseConfig = {
    apiKey: "AIzaSyBehCsmIH5Pir9WPmz-EmDpErSmvpOlIu0",
    authDomain: "dokume-4298e.firebaseapp.com",
    databaseURL: "https://dokume-4298e.firebaseio.com",
    projectId: "dokume-4298e",
    storageBucket: "dokume-4298e.appspot.com",
    messagingSenderId: "223125853086",
    appId: "1:223125853086:web:91084caabc6e078d123c8f"
  };

  function init(sw) {

    if (!firebase.messaging.isSupported()) {
      //console.log('FCM not supported');
      return false;
    }
    // Initialize Firebase
    firebase.initializeApp(firebaseConfig);

    // Retrieve Firebase Messaging object.
    messaging = firebase.messaging();

    messaging.useServiceWorker(sw);

    // Add the public key generated from the console here.
    messaging.usePublicVapidKey("BOHPzWUUGo40sApqYOUnRFqZfwK_XrP6zfyM82CDjoFbOs9ySe13BL5EJuHcMdm4Y-T4CW4S8ZU8sBJOKPYXPOw");

  }

  function getToken() {
    // Get Instance ID token. Initially this makes a network call, once retrieved
    // subsequent calls to getToken will return from cache.
    if (!messaging) {
      return false;
    }

    messaging.getToken().then((currentToken) => {
      //console.log(currentToken);
      if (currentToken) {
        FCM_TOKEN = currentToken;
        sendTokenToServer(currentToken);

      } else {
        // Show permission request.
        //console.log('No Instance ID token available. Request permission to generate one.');

        setTokenSentToServer(false);
      }
    }).catch((err) => {
      //console.log('An error occurred while retrieving token. ', err);
      setTokenSentToServer(false);
    });

    // Callback fired if Instance ID token is updated.
    messaging.onTokenRefresh(() => {
      messaging.getToken().then((refreshedToken) => {
        //console.log('Token refreshed.');
        // Indicate that the new Instance ID token has not yet been sent to the
        // app server.
        setTokenSentToServer(false);
        // Send Instance ID token to app server.
        sendTokenToServer(refreshedToken);
        // ...
      }).catch((err) => {
        //console.log('Unable to retrieve refreshed token ', err);
      });
    });

    bindEvents();
  }

  function bindEvents() {
    messaging.onMessage(function(payload) {
      //console.log("Message received. ", payload);
      DM_TEMPLATE.showSystemNotification(2, `<b>${payload.notification.title}</b><br>${payload.notification.body}`);
      //NotisElem.innerHTML = NotisElem.innerHTML + JSON.stringify(payload)
    });
  }

  function sendTokenToServer(currentToken) {
    if (!isTokenSentToServer()) {
      // TODO(developer): Send the current token to your server.
      backend.save('token/register', {
        token: currentToken
      }, function(data) {
        if (!util.errorHandler(data)) return false;

        setTokenSentToServer(true);

      }, 'general', 1);

    } else {
      //console.log('Token already sent to server so won\'t send it again unless it changes');
    }

  }

  function isTokenSentToServer() {
    return window.localStorage.getItem('sentToServer') === '1';
  }

  function setTokenSentToServer(sent) {
    window.localStorage.setItem('sentToServer', sent ? '1' : '0');
  }

  function unregister(callback) {

    if (!FCM_TOKEN) {

      setTokenSentToServer(false);
      if (callback) {
        callback();
      }

    } else {

      backend.save('token/unregister', {
        token: FCM_TOKEN
      }, function(data) {
        //if (!util.errorHandler(data)) return false;
        setTokenSentToServer(false);
        if (callback) {
          callback();
        }
      }, 'general', 1);

    }

  }

  return {
    init,
    getToken,
    unregister
  };

})();
