'use strict';

const crypto = require('crypto');
const util = require('util');

const pbkdf2 = util.promisify(crypto.pbkdf2);

const db = require('./db');
const PBKDF2ITERATIONS = 100000;


module.exports = {
	init: async function () {
		const auth = await db('auth');

		if (!await auth.findOne({key: 'salt'})) {
			const salt = crypto.randomBytes(32);
			await auth.insertOne({key: 'salt', value: salt.toString('hex')});

			const key = await pbkdf2('admin', salt, PBKDF2ITERATIONS, 32, 'sha3-256');
			await auth.insertOne({key: 'key', value: key.toString('hex')});
		}
	},

	verifyPassword: async function (password) {
		const auth = await db('auth');
		const {value: encodedSalt} = await auth.findOne({key: 'salt'});
		const {value: encodedKey} = await auth.findOne({key: 'key'});

		const salt = Buffer.from(encodedSalt, 'hex');
		const key = await pbkdf2(password, salt, PBKDF2ITERATIONS, 32, 'sha3-256');
		return key.equals(Buffer.from(encodedKey, 'hex'));
	},

	setPassword: async function (newPassword) {
		const auth = await db('auth');

		const salt = crypto.randomBytes(32);
		await auth.updateOne({key: 'salt'}, {$set: {value: salt.toString('hex')}});

		const key = await pbkdf2(newPassword, salt, PBKDF2ITERATIONS, 32, 'sha3-256');
		await auth.updateOne({key: 'key'}, {$set: {value: key.toString('hex')}});
	}
};
