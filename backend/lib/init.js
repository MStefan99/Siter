'use strict';

const db = require('./db');
const auth = require('./auth');
const metrics = require('./metrics');
const appManager = require('./app_manager');


async function init() {
	auth.init();

	setInterval(async () => {
		const analytics = appManager.getAnalyticsOptions();
		const apps = appManager.getApps().filter(a => a.analytics.enabled);

		if (analytics.enabled || apps.length) {
			const collectedMetrics = await metrics.collect();
			analytics.enabled && await metrics.submit(collectedMetrics, analytics.url, analytics.key);

			for (const app of apps) {
				app.analytics.metricsEnabled && await metrics.submit(collectedMetrics, app.analytics.url, app.analytics.key);
			}
		}
	}, 1000 * 10);
}

module.exports = {init};
