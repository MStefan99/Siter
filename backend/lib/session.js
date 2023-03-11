'use strict';

const uuid = require('uuid');

const db = require('./db');


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


	async delete() {
		const sessions = await db('sessions');
		await sessions.deleteOne({id: this.id});
	}
}


module.exports = Session;
