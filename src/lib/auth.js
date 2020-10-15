'use strict';

const crypto = require('crypto');

const openDB = require('./db');
const key = 'Siter secret key';


module.exports = {
	init: async () => {
		const db = await openDB();

		const option = await db.get(`select *
                               from options
                               where key='passwordHash'`);

		if (!option) {
			const hmac = crypto.createHmac('sha256', key);
			const hash = hmac.update('admin').digest('hex');

			await db.run(`insert into options(key, value)
                  values ('passwordHash', $hash)`,
				{$hash: hash});
		}
	},

	verifyPassword: async (password) => {
		const db = await openDB();
		const hmac = crypto.createHmac('sha256', key);

		const option = await db.get(`select *
                                 from options
                                 where key='passwordHash'`);

		return hmac.update(password).digest('hex') === option.value;
	},

	setPassword: async (newPassword) => {
		const db = await openDB();

		const hmac = crypto.createHmac('sha256', key);
		const hash = hmac.update(newPassword).digest('hex');

		await db.run(`update options set value=$hash where key='passwordHash'`,
			{$hash: hash});
	},
};
