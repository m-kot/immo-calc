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
    insertAdjacentHTML: function() {
      console.warn(selector + " is not defined");
    },
    addEventListener: function() {
      console.warn(selector + " is not defined");
    },
    classList: {
      add: function() {
        console.warn(selector + " is not defined");
      },
      remove: function() {
        console.warn(selector + " is not defined");
      }
    },
    dataset: {},
    reset: function() {
      console.warn(selector + " is not defined");
    },
    getContext: function() {
      console.warn(selector + " is not defined");
    },
    remove: function() {
      console.warn(selector + " is not defined");
    }
  }
}
