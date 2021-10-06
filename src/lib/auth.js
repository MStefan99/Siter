'use strict';

const crypto = require('crypto');
const util = require('util');

const pbkdf2 = util.promisify(crypto.pbkdf2);

const smartConfig = require('./config');
const PBKDF2ITERATIONS = 100000;


module.exports = {
	init: function () {
		return new Promise(resolve => {
			smartConfig.then(config => {
				if (!config.auth) {
					config.auth = {};
				}

				if (!config.auth.salt) {
					const salt = crypto.randomBytes(32);
					config.auth.salt = salt.toString('base64');

					pbkdf2('admin', salt, PBKDF2ITERATIONS, 32, 'sha3-256').then(key => {
						config.auth.key = key.toString('base64');
						resolve();
					});
				}
			});
		});
	},


	verifyPassword: function (password) {
		return new Promise(resolve => {
			smartConfig.then(config => {
				const salt = Buffer.from(config.auth.salt, 'base64');
				pbkdf2(password, salt, PBKDF2ITERATIONS, 32, 'sha3-256').then(key =>
						resolve(key.equals(Buffer.from(config.auth.key, 'base64'))));
			});
		});
	},


	setPassword: function (newPassword) {
		return new Promise(resolve => {
			smartConfig.then(config => {
				const salt = crypto.randomBytes(32);
				config.auth.salt = salt.toString('base64');

				pbkdf2(newPassword, salt, PBKDF2ITERATIONS, 32, 'sha3-256').then(key => {
					config.auth.key = key.toString('base64');
					resolve();
				});
			});
		});
	}
};
