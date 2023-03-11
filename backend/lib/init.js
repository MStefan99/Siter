'use strict';

const db = require('./db');
const auth = require('./auth');
const metrics = require('./metrics');


async function init() {
	auth.init();

	const analytics = await db('analytics');
	const {value: active} = await analytics.findOne({key: 'active'}) || {active: false};

	if (active) {
		setInterval(async () => {
			metrics.submit(await metrics.collect(), analytics.analytics.url, analytics.analytics.key);
		}, 1000 * 30);
	}
}

module.exports = {init};
