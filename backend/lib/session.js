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

		const sessions = await db('sessions');
		await sessions.insertOne(session);

		return session;
	}


	static async getSessions() {
		const sessions = await db('sessions');
		const sessionDataArray = await sessions.find();

		return sessionDataArray.map(s => Object.assign(new Session(), s));
	}


	static async getSessionByID(sessionID) {
		const sessions = await db('sessions');
		const sessionData = await sessions.findOne({id: sessionID});

		if (!sessionData) {
			return null;
		} else {
			const session = new Session();

			Object.assign(session, sessionData);
			return session;
		}
	}


	static async deleteAllSessions() {
		const collection = await db('sessions');
		await collection.deleteMany();
	}


	async save() {
		const sessions = await db('sessions');
		await sessions.replaceOne({id: this.id}, this);
	}


	async delete() {
		const sessions = await db('sessions');
		await sessions.deleteOne({id: this.id});
	}
}


module.exports = Session;
