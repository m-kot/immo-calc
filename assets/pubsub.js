//events - a super-basic Javascript (publish subscribe) pattern

var DM_PUBSUB = (function() {

  var events = {};

  function on(eventName, fn) {
    off(eventName, fn);
    events[eventName] = events[eventName] || [];
    events[eventName].push(fn);
  }

  function off(eventName, fn) {
    if (events[eventName]) {
      for (var i = 0; i < events[eventName].length; i++) {
        //if (events[eventName][i] === fn) {
        if (events[eventName][i].toString() == fn.toString()) {
          events[eventName].splice(i, 1);
          break;
        }
      };
    }
  }

  function emit(eventName, data) {
    if (events[eventName]) {
      events[eventName].forEach(function(fn) {
        fn(data);
      });
    }
  }

  function reset(eventName) {
    if (events[eventName]) {
      delete events[eventName];
    }
  }

  return {
    on: on,
    off: off,
    emit: emit,
    reset: reset
  }
})();
