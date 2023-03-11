'use strict';

const smartConfig = require('./config');
const auth = require('./auth');
const metrics = require('./metrics');

function init() {
	return new Promise(resolve => {
		smartConfig.then(config => {
			auth.init();

			if (!config.security) {
				config.security = {};
			}

			if (!config.sessions) {
				config.sessions = [];
			}

			if (!config.apps) {
				config.apps = [];
			}

			if (!config.analytics) {
				config.analytics = {};
			}

			if (config.analytics.active) {
				setInterval(async () => {
					metrics.submit(await metrics.collect(), config.analytics.url, config.analytics.key);
				}, 1000 * 30);
			}

			resolve();
		});
	});
}

module.exports = {init};
