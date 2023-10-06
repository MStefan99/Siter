'use strict';

const crypto = require('crypto');
const util = require('util');

const pbkdf2 = util.promisify(crypto.pbkdf2);

const db = require('./db');
const {colors, resetConsole} = require("./log");
const PBKDF2ITERATIONS = 100000;


module.exports = {
	init: async function () {
		if (!await db.auth.get('salt')) {
			const salt = crypto.randomBytes(32);
			await db.auth.set('salt', salt.toString('hex'));

			const key = await pbkdf2('admin', salt, PBKDF2ITERATIONS, 32, 'sha3-256');
			await db.auth.set('key', key.toString('hex'));
		}
	},

	verifyPassword: async function (password) {
		const encodedSalt = await db.auth.get('salt');
		const encodedKey = await db.auth.get('key');

		console.log('salt', encodedSalt);
		const salt = Buffer.from(encodedSalt, 'hex');
		const key = await pbkdf2(password, salt, PBKDF2ITERATIONS, 32, 'sha3-256');
		return key.equals(Buffer.from(encodedKey, 'hex'));
	},

	setPassword: async function (newPassword) {
		const salt = crypto.randomBytes(32);
		await db.auth.set('salt', salt.toString('hex'));

		const key = await pbkdf2(newPassword, salt, PBKDF2ITERATIONS, 32, 'sha3-256');
		await db.auth.set('key', key.toString('hex'));
	},

	async getRandomChallenge() {
		const apps = await db.apps.getAll();
		const app = apps[Math.floor(Math.random() * apps.length)];

		const netOptions = await db.net.getAll();
		const net = {};
		netOptions.forEach(o => net[o.key] = o.value);

		const challenges = [];

		if (app?.hosting.enabled) {
			if (app.hosting.source.secure) {
				challenges.push({
					question: `For the application "${app.name}", what is the full path to the certificate file?`,
					answer: app.hosting.source.cert
				});
				challenges.push({
					question: `For the application "${app.name}", what is the full path to the key file?`,
					answer: app.hosting.source.key
				});
			}
			if (app.hosting.target.directory) {
				challenges.push({
					question: `For the application "${app.name}", what is the full path to the target directory?`,
					answer: app.hosting.target.directory
				});
			} else {
				challenges.push({
					question: `For the application "${app.name}", what is the target domain?`,
					answer: app.hosting.target.hostname
				});
				challenges.push({
					question: `For the application "${app.name}", what is the target port?`,
					answer: app.hosting.target.port.toString()
				});
			}
		}

		if (net.httpsEnabled) {
			challenges.push({
				question: `What is the full path to the Siter certificate file?`,
				answer: net.cert
			});
			challenges.push({
				question: `What is the full path to the Siter key file?`,
				answer: net.key
			});
		}

		if (!challenges.length) {
			const code = crypto.randomBytes(4).toString('hex');
			console.log(`${colors[3]}[Siter]${resetConsole}`, 'Your Siter login code:', code);

			challenges.push({
				question: `What is the one-time code displayed in the Siter console?`,
				answer: code
			});
		}

		return challenges[Math.floor(Math.random() * challenges.length)];
	},

	verifyChallenge(challenge, answer) {
		if (Array.isArray(challenge.answer)) {
			return challenge.answer.includes(answer);
		} else {
			return challenge.answer === answer;
		}
	}
};
