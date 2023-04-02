'use strict';

const auth = require('./auth');
const metrics = require('./metrics');
const appManager = require('./app_manager');


async function init() {
	await auth.init();

	setInterval(async () => {
		const analytics = appManager.getAnalyticsOptions();
		const collectedMetrics = await metrics.collect();
		analytics.enabled && await metrics.submit(collectedMetrics, analytics.url, analytics.telemetryKey);

		const apps = appManager.getApps().filter(a => a.analytics.enabled);
		for (const app of apps) {
			app.analytics.metricsEnabled && await metrics.submit(collectedMetrics, app.analytics.url, app.analytics.key);
		}
	}, 1000 * 10);
}

module.exports = {init};
