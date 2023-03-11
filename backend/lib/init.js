'use strict';

const db = require('./db');
const auth = require('./auth');
const metrics = require('./metrics');
const appManager = require('./app_manager');


async function init() {
	auth.init();

	setInterval(async () => {
		const analytics = appManager.getAnalyticsOptions();
		analytics.enabled && metrics.submit(await metrics.collect(), analytics.url, analytics.key);
	}, 1000 * 10);
}

module.exports = {init};
