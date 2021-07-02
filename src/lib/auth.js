'use strict';

const crypto = require('crypto');

const smartConfig = require('./config');
const key = 'Siter secret key';


module.exports = {
	init: async () => {
		const config = await smartConfig;

		if (!config.options?.passwordHash) {
			const hmac = crypto.createHmac('sha256', key);
			config.options.passwordHash = hmac.update('admin').digest('hex');
		}
	},


	verifyPassword: async (password) => {
		const config = await smartConfig;
		const hmac = crypto.createHmac('sha256', key);

		return hmac.update(password).digest('hex') === config.options.passwordHash;
	},


	setPassword: async (newPassword) => {
		const config = await smartConfig;

		const hmac = crypto.createHmac('sha256', key);
		config.options.passwordHash = hmac.update(newPassword).digest('hex');
	},
};
