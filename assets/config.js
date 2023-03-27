var DM_CORE_CONFIG = {
  DOKUME_URL: 'https://my.dokume.net',
  BACKEND_URL: 'https://api.dokume.net',
  PROFILE_ID: 2981,
  API_KEY: '3Iz9yRHGz5JW9OtETF4uCT92RZXMzLSO5lJsfA1oFtnDJprXq9tO4m1MDZAOJEgd',
  DOKUME_PLATFORM: 'private', // private, app
  SUBDOMAIN_WHITELABEL: true, // load a subdomain depending whitelabel
  LANGUAGE: 'EN',
  //WHITELABEL: '', // load a fixed whitelabel
  AUTH_MODE: 'private', // private, landing, public, mix
  LANDING_URL: '#/dashboard_app',
  AUTH_SUCCESS_URL: '#/dashboard_app',
  LOGIN_CALLBACK: null,
  LOGOUT_CALLBACK: null,
  WEBSOCKET: 'wss://wss.dokume.net',
  VERIFY_EMAIL: false,
  MODE: 'test',
  ENVIRONMENT: 'dev',
  TRAN_PROFILE_ID: 13199,
  DO_AUTO_TRANSLATION: false,
  PLATFORM_NAME: 'DokuMe',
  PLATFORM_TEMPLATE: 1,
  SUPPORT_INFO: null
}

var str = window.location.href;
var arrValue = str.split("//");
var arrSecondValue = arrValue[1].split(".");
var subdomain = arrSecondValue[0];

if (DM_CORE_CONFIG.DOKUME_PLATFORM === 'app') {
  subdomain = 'my';
}

var transCls = null;
var idbCls = null;

var userLang = navigator.language || navigator.userLanguage;

if (userLang.toLowerCase().includes('de')) {
  DM_CORE_CONFIG.LANGUAGE = 'DE';
}

if (subdomain === 'test' || subdomain === 'djb-spielwiese' || document.location.href.includes('127.0.0.1') || subdomain == 192) {
  //if (false) {
  DM_CORE_CONFIG.BACKEND_URL = 'https://api.test.dokume.net';
  DM_CORE_CONFIG.DOKUME_URL = 'https://test.dokume.net/platform';
  DM_CORE_CONFIG.WEBSOCKET = 'wss://development.dokume.net';
  DM_CORE_CONFIG.PLATFORM_NAME = 'TEST DokuMe'

  /*DM_CORE_CONFIG.BACKEND_URL = 'https://api.stage.dokume.net';
  DM_CORE_CONFIG.DOKUME_URL = 'http:/127.0.0.1';
  DM_CORE_CONFIG.WEBSOCKET = 'wss://api.stage.dokume.net/wss';*/

} else if (subdomain === 'stage') {
  DM_CORE_CONFIG.BACKEND_URL = 'https://dokume.net/backend/stage/src';
  DM_CORE_CONFIG.DOKUME_URL = 'https://stage.dokume.net';
} else if (subdomain === 'pentest') {
  DM_CORE_CONFIG.BACKEND_URL = 'https://api.pentest.dokume.net';
  DM_CORE_CONFIG.DOKUME_URL = 'https://pentest.dokume.net';
  DM_CORE_CONFIG.WEBSOCKET = 'wss://wss.pentest.dokume.net';
} else if (subdomain === 'klinestage') {
  DM_CORE_CONFIG.BACKEND_URL = 'https://api.stage.kline-portal.com';
  DM_CORE_CONFIG.DOKUME_URL = 'https://klinestage.dokume.net';
  DM_CORE_CONFIG.WEBSOCKET = 'wss://wss.stage.kline-portal.com';
}