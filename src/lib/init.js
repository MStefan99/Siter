'use strict';

const smartConfig = require('./config');
const auth = require('./auth');


function init() {
	return smartConfig.then(config => {
		auth.init();

		if (!config.sessions) {
			config.sessions = [];
		}

		if (!config.routes) {
			config.routes = [];
		}
	});
}


module.exports = {
	init: init
};
