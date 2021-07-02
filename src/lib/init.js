'use strict';

const smartConfig = require('./config');
const auth = require('./auth');


async function init() {
	const config = await smartConfig;

	if (!config.options) {
		config.options = {};
		await auth.init();
	}
	if (!config.sessions) {
		config.sessions = [];
	}
	if (!config.routes) {
		config.routes = [];
	}
}


module.exports = {
	init: init,
};
