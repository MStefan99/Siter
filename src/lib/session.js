'use strict';

const uuid = require('uuid');

const openDB = require('./db');


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

		const db = await openDB();
		await db.run(`insert into sessions(id, ip, ua, time)
                  values ($id, $ip, $ua, $time)`, {
			$id: session.id, $ip: session.ip,
			$ua: session.ua, $time: session.time
		});
		await db.close();

		return session;
	}


	static async getSessions() {
		const sessions = [];

		const db = await openDB();
		const sessionDataArray = await db.all(`select * from sessions`);
		await db.close();

		for (const sessionData of sessionDataArray) {
			const session = new Session();

			Object.assign(session, sessionData);
			sessions.push(session);
		}
		return sessions;
	}


	static async getSessionByID(sessionID) {
		const db = await openDB();
		const sessionData = await db.get(`select *
                                      from sessions
                                      where id=$id`, {$id: sessionID});
		await db.close();

		if (!sessionData) {
			return null;
		} else {
			const session = new Session();

			Object.assign(session, sessionData);
			return session;
		}
	}


	static async deleteAllSessions() {
		const db = await openDB();
		// noinspection SqlWithoutWhere
		await db.run(`delete
                  from sessions`);
		await db.close();
		return 'OK';
	}


	async delete() {
		const db = await openDB();
		await db.run(`delete
                  from sessions
                  where id=$id`, {$id: this.id});
		await db.close();
		return 'OK';
	}
}


module.exports = Session;
