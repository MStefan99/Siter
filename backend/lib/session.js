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

		const collection = await db('sessions');
		await collection.insertOne(session);

		return session;
	}


	static async getSessions() {
		const sessions = [];

		const collection = await db('sessions');
		const sessionDataArray = collection.find();

		for (const sessionData of sessionDataArray) {
			const session = new Session();

			Object.assign(session, sessionData);
			sessions.push(session);
		}
		return sessions;
	}


	static async getSessionByID(sessionID) {
		const collection = await db('sessions');
		const sessionData = await collection.findOne({id: sessionID});

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
		await collection.delete();
	}


	async delete() {
		(await db).collection('sessions').deleteOne({id: this.id});
	}
}


module.exports = Session;
