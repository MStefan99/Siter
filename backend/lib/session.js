'use strict';

const crypto = require('crypto');

const db = require('./db');


class Session {
	id;
	ip;
	ua;
	time;
	challenge;


	static async createSession(ip, ua, challenge) {
		const session = new Session();

		session.id = crypto.randomUUID();
		session.ip = ip;
		session.ua = ua;
		session.time = Date.now();
		session.challenge = challenge;

		await db.sessions.add(session);
		return session;
	}


	static async getSessions() {
		const sessionDataArray = await db.sessions.getAll();

		return sessionDataArray.map(s => Object.assign(new Session(), s));
	}


	static async getSessionByID(sessionID) {
		const sessionData = await db.sessions.getByID(sessionID);

		if (!sessionData) {
			return null;
		} else {
			const session = new Session();

			Object.assign(session, sessionData);
			return session;
		}
	}


	static async deleteAllSessions() {
		await db.sessions.deleteAll();
	}


	async save() {
		await db.sessions.update(this.id, this);
	}


	async delete() {
		await db.sessions.deleteAll();
	}
}


module.exports = Session;
