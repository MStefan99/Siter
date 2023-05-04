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
	},

	async getRandomChallenge() {
		const appCollection = await db('apps');
		const apps = await appCollection.find().toArray();
		const app = apps[Math.floor(Math.random() * apps.length)];

		const netCollection = await db('net');
		const netOptions = await netCollection.find().toArray();
		const net = {};
		netOptions.forEach(o => net[o.key] = o.value);

		const challenges = [];

		if (app.hosting.enabled) {
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
			console.log('Your Siter login code:', code);

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
