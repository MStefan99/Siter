'use strict';

const smartConfig = require('./config');
const auth = require('./auth');

function init() {
	return new Promise(resolve => {
		smartConfig.then(config => {
			auth.init();

			if (!config.net) {
				config.net = {};
			}

			if (!config.sessions) {
				config.sessions = [];
			}

			if (!config.apps) {
				config.apps = [];
			}

			resolve();
		});
	});
}

module.exports = {init};
