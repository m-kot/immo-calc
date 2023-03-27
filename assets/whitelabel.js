'use strict';

var DM_WHITELABEL = (function() {

  function init(tenant) {

    if (typeof DM_CORE_CONFIG != 'undefined' && DM_CORE_CONFIG.DOKUME_PLATFORM === 'app') {
      subdomain = tenant;
    }
    
    // Get HTML head element
    var head = document.getElementsByTagName('HEAD')[0]; 
  
    // Create new link Element
    var link = document.createElement('link');

    // set the attributes for link element 
    link.rel = 'stylesheet'; 
    link.type = 'text/css';
    link.href = `${typeof DM_CORE_CONFIG == 'undefined' ? '../' : ''}whitelabel/${tenant}/style.css`; 

    // Append link element to HTML head
    head.appendChild(link); 

    $.getScript(`${typeof DM_CORE_CONFIG == 'undefined' ? '../' : ''}whitelabel/${tenant}/config.js`);
  }

  function getDefaultApps() {
    if (typeof DM_LOADED_WHITELABEL === 'undefined' || !DM_LOADED_WHITELABEL.getDefaultApps) return [];
    
    return DM_LOADED_WHITELABEL.getDefaultApps();
  }

  function getWelcomeImageURL() {
    
  }

  function initLogin() {
    if (typeof DM_LOADED_WHITELABEL === 'undefined' || !DM_LOADED_WHITELABEL.initLogin) return false;

    DM_LOADED_WHITELABEL.initLogin();
    
  }

  function getSignupCategories() {
    if (typeof DM_LOADED_WHITELABEL === 'undefined' || !DM_LOADED_WHITELABEL.getSignupCategories) return false;
    
    return DM_LOADED_WHITELABEL.getSignupCategories();
    
  }

  function getSignupCategoriesSubdomain() {
    //console.log(DM_LOADED_WHITELABEL);
    if (typeof DM_LOADED_WHITELABEL === 'undefined' || !DM_LOADED_WHITELABEL.getSignupCategoriesSubdomain) return false;
    
    return DM_LOADED_WHITELABEL.getSignupCategoriesSubdomain();
    
  }

  function editSignupParams(data) {
    if (typeof DM_LOADED_WHITELABEL === 'undefined' || !DM_LOADED_WHITELABEL.editSignupParams) return false;
    
    return DM_LOADED_WHITELABEL.editSignupParams(data);
    
  }

  function getConfig() {
    if (typeof DM_LOADED_WHITELABEL === 'undefined' || !DM_LOADED_WHITELABEL.getConfig) return false;
    
    return DM_LOADED_WHITELABEL.getConfig();
  }

  return {init, getDefaultApps, getWelcomeImageURL, initLogin, getSignupCategories, getSignupCategoriesSubdomain, editSignupParams, getConfig}
})();