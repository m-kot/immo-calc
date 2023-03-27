'use strict';

var DM_DOKUME_FAQ = (function () {

  var introSteps = [];
  var LAST_STEP = null;
  var hintsJSON = [];
  var intro = null;
  var faqJSON = [];

  const BACKEND_URL = 'https://api.dokume.net';
  const PROFILE_ID = 12872;
  const API_KEY = 'IA3gwK839wjut81kbJUmCOdvksXk0javqu4Ge6aThV73jL6xcbze1FNvT2jgyUrL';

  const faqBackend = new DokuMe_PublicBackend(BACKEND_URL, API_KEY, PROFILE_ID);

  init();

  function init() {
    //getFAQ();
    bindEvents();
  }

  function bindEvents() {
    $('#DM_FAQ_PLUGIN').on('click', '.dm_faq_head', function () {
      $(this).parent().find('.dm_faq_body').toggle();
    });
  }

  function getTour(tourId, callback) {
    backend.get('tour/' + tourId, null, function (data) {
      if (data.SUCCESS != true) {
        return false;
      }

      if (callback) {
        callback(data.MESSAGE);
      }
    }, 'general');

    /*faqBackend.getObject(456, tourId, {
      references: [{
        OBJECT: 'FAQ_ARTICLE'
      }]
    }, function(data) {
      if (!util.errorHandler(data)) return false;

      if (callback) {
        callback(data.MESSAGE);
      }
    });*/
  }

  function getFAQ(appId, categoryId, searchKey, tourId, directStart) {

    var params = {
      limit: [{
        order: {
          direction: 'asc',
          by: 'SORT'
        }
      }],
      where: [{
        key: 'ACTIVE',
        operator: 'is',
        value: 1
      }]
    };

    if (appId != 0) {
      params.where.push({
        key: 'APP_ID',
        operator: 'is',
        value: appId
      });
    }

    if (categoryId != 0) {
      params.where.push({
        key: 'CATEGORY_ID',
        operator: 'is',
        value: categoryId
      });
    }

    if (searchKey && searchKey != 0) {
      params.where.push({
        key: 'SEARCH_KEY',
        operator: 'is',
        value: searchKey
      });
    }

    if (tourId) {
      params.where.push({
        key: 'TOUR_ID',
        operator: 'is',
        value: tourId
      });
    }

    faqBackend.getObject(353, null, params, function (data) {
      if (!util.errorHandler(data)) return false;

      faqJSON = data.MESSAGE;

      showFAQ(data.MESSAGE, directStart);
    })
  }

  function showFAQ(data, directStart) {
    var html = '';
    var showTour = false;
    introSteps = [];
    hintsJSON = [];

    for (var idx in data) {

      if (data[idx].TYPE == 1) {
        showTour = true;
      }

      html += `
      <div class="dm_faq">
        <div class="dm_faq_head" data-i18n="DM_TOUR_FAQ.title_${data[idx].ID}">
          ${DokuMe_Translation.i18n('DM_TOUR_FAQ', `title_${data[idx].ID}`, data[idx].TITLE)}
        </div>
        <div class="dm_faq_body" data-i18n="DM_TOUR_FAQ.article_${data[idx].ID}">
          ${DokuMe_Translation.i18n('DM_TOUR_FAQ', `article_${data[idx].ID}`, data[idx].ARTICLE)}
        </div>
      </div>`;

    }

    if (html === '') {
      html = '<span data-i18n="DM_TOUR.noEntries">Für diesen Bereich gibt es keine FAQ Beiträge.</span>';
    }

    if (showTour) {
      showTour = `<div class="d-grid"><button id="startFAQ" class="btn btn-lg btn-block btn-danger animated pulse infinite mb-4" data-i18n="DM_TOUR.startTour">Tour starten</button></div>`
    } else {
      showTour = '';
    }

    if (directStart) {
      startIntro();
      return false;
    }

    el('DM_FAQ_PLUGIN').innerHTML = showTour + html;

    $('#DM_FAQ_PLUGIN').i18n();

    if (showTour !== '') {

      el('startFAQ').addEventListener('click', function () {
        $('#DM_INFO_MODAL').modal('hide');
        startIntro();
      });
    }
  }

  function startIntro(doContinueTour) {

    $('#DM_INFO_MODAL').modal('hide');

    var data = faqJSON.filter(a => a.TYPE == 1);

    if (data.length < 1) return false;

    const tour = new Shepherd.Tour({
      steps: introSteps,
      useModalOverlay: true,
      exitOnEsc: true,
      defaultStepOptions: {
        classes: 'shadow-md bg-purple-dark',
        scrollTo: true
      }
    });

    for (var idx in data) {
      if (doContinueTour && idx <= LAST_STEP) continue;

      var nextAction = tour.next;

      if (data[idx].URL) {
        nextAction = createNextAction(tour, idx, data[idx].URL);
      }

      LAST_STEP = null;

      const step = {
        title: DokuMe_Translation.i18n('DM_TOUR_FAQ', `title_${data[idx].ID}`, data[idx].TITLE),
        text: DokuMe_Translation.i18n('DM_TOUR_FAQ', `article_${data[idx].ID}`, data[idx].ARTICLE),
        popperOptions: {
          modifiers: [{ name: 'offset', options: { offset: [0, 12] } }]
        },
        cancelIcon: true,
        classes: 'example-step-extra-class',
        buttons: [{
          text: idx < data.length - 1 ? transCls.i18Return('action', 'next', 'Next') : transCls.i18Return('action', 'finish', 'Finish'),
          action: nextAction
        }]
      }

      if (idx > 0) {
        step.buttons.unshift({
          text: transCls.i18Return('action', 'back', 'Back'),
          action: tour.back
        })
      }

      if (data[idx].INTRO_SELECTOR) {
        step.attachTo = {
          element: elq(data[idx].INTRO_SELECTOR),
          on: 'bottom'
        };

        if (data[idx].INTRO_SELECTOR === '#logoutBTN' || data[idx].INTRO_SELECTOR === '#DM_HELP_BTN' || data[idx].INTRO_SELECTOR === '#DM_SETTINGS_LINK') {

          step.beforeShowPromise = function () {
            return new Promise(function (resolve) {

              setTimeout(function () {
                bootstrap.Dropdown.getOrCreateInstance(el('DM_PROFILE_IMAGE')).show();

                setTimeout(function () {
                  resolve()
                }, 100);
              }, 100);
            });
          };
           
        } else if (data[idx].INTRO_SELECTOR === '.DM_APP_MENU' && elq('#DM_NAVBAR .navbar-toggler').offsetParent) {
          step.attachTo.element = elq('#DM_NAVBAR .navbar-toggler')
        }
      }

      tour.addStep(step)
    }

    tour.start();
  }

  function createNextAction(tour, tempStepIdx, redirect) {
    return function() {
      LAST_STEP = tempStepIdx;
      DM_PUBSUB.on('DM_PAGE_CHANGED', continueTour);
      window.location = redirect;
      tour.cancel();
    }
  }

  function continueTour() {
    DM_PUBSUB.off('DM_PAGE_CHANGED', continueTour);

    if (!LAST_STEP) return false;

    setTimeout(function() {
      startIntro(true);
    }, 1500);
  }

  return {
    getTour,
    getFAQ,
    startIntro,
    bindEvents
  };
})();