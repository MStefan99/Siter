'use strict';

const uuid = require('uuid');

const smartConfig = require('./config');


class Session {
	id;
	ip;
	ua;
	time;


	static async createSession(ip, ua) {
		const session = new Session();

		session.id = uuid.v4();
		session.ip = ip;
		session.ua = ua;
		session.time = Date.now();

		const config = await smartConfig;
		config.sessions.push(session);

		return session;
	}


	static async getSessions() {
		const sessions = [];

		const config = await smartConfig;
		const sessionDataArray = config.sessions;

		for (const sessionData of sessionDataArray) {
			const session = new Session();

			Object.assign(session, sessionData);
			sessions.push(session);
		}
		return sessions;
	}


	static async getSessionByID(sessionID) {
		const config = await smartConfig;
		const sessionData = config.sessions.find(s => s.id = sessionID);

		if (!sessionData) {
			return null;
		} else {
			const session = new Session();

			Object.assign(session, sessionData);
			return session;
		}
	}


	static async deleteAllSessions() {
		const config = await smartConfig;
		config.sessions = [];
		return 'OK';
	}


	async delete() {
		const config = await smartConfig;
		config.sessions.splice(config.sessions.findIndex(s => s.id === this.id), 1);
		return 'OK';
	}
}


module.exports = Session;
