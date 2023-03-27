'use strict';

var DM_TENANTS = (function () {

	var accessGroups = null;
	var accessProfiles = null;

	//Groups
	function getGroups(callback) {

		backend.getFunction('groups', null, function (data) {
			accessGroups = data.MESSAGE;
			DM_PUBSUB.emit('getAccessGroups', data.MESSAGE);

			if (typeof callback === 'function') {
				callback(data.MESSAGE);
			}
		}, 1);
	}

	//Profiles
	function getProfiles(callback) {

		backend.getFunction('rights/access', null, function (data) {

			accessProfiles = data.MESSAGE;
			DM_PUBSUB.emit('getProfiles', accessProfiles);

			if (typeof callback === 'function') {
				callback(data.MESSAGE);
			}
		}, 1);
	}

	function getProfilesJSON() {
		return accessProfiles;
	}

	function getGroupsJSON() {
		return accessGroups;
	}

	function reset() {
		accessGroups = null;
		accessProfiles = null;
	}

	return {
		getGroups,
		getProfiles,
		getGroupsJSON,
		getProfilesJSON,
		reset
	}

})();