'use strict';

const path = require("path");
const fs = require('fs');
const {MongoClient} = require('mongodb');
const smartConfig = require('@mstefan99/smart-config');

const configPath = path.join(__dirname, '..', '..', 'config.json');

class MongoAdapter {
	#dbPromise = null;

	constructor() {
		const url = 'mongodb://127.0.0.1:27017';
		const client = new MongoClient(url);
		this.#dbPromise = client.connect().then(conn => conn.db('siter'));
	}

	#kvStore = (name) => ({
		getAll: () => this.#dbPromise.then(db => db.collection(name)).then(coll => coll.find().toArray()),
		get: (key) => this.#dbPromise.then(db => db.collection(name)).then(coll => coll.findOne({key})).then(r => r.value),
		set: (key, value) => this.#dbPromise.then(db => db.collection(name)).then(coll => coll.updateOne({key}, {$set: {value}}, {upsert: true})),
		clear: () => this.#dbPromise.then(db => db.collection(name)).then(coll => coll.deleteMany())
	});

	auth = this.#kvStore('auth');
	net = this.#kvStore('net');
	analytics = this.#kvStore('analytics');

	sessions = {
		getAll: () => this.#dbPromise.then(db => db.collection('sessions')).then(coll => coll.find().toArray()),
		getByID: (id) => this.#dbPromise.then(db => db.collection('sessions')).then(coll => coll.findOne({id})),
		add: (app) => this.#dbPromise.then(db => db.collection('sessions')).then(coll => coll.insertOne(app)),
		update: (id, session) => this.#dbPromise.then(db => db.collection('sessions')).then(coll => coll.replaceOne({id}, session)),
		delete: (id) => this.#dbPromise.then(db => db.collection('sessions')).then(coll => coll.deleteOne({id})),
		deleteAll: () => this.#dbPromise.then(db => db.collection('sessions')).then(coll => coll.deleteMany()),
	};

	apps = {
		getAll: () => this.#dbPromise.then(db => db.collection('apps')).then(coll => coll.find().sort({'hosting.order': 1}).toArray()),
		add: (app) => this.#dbPromise.then(db => db.collection('apps')).then(coll => coll.insertOne(app)),
		update: (id, app) => this.#dbPromise.then(db => db.collection('apps')).then(coll => coll.replaceOne({id}, app)),
		delete: (id) => this.#dbPromise.then(db => db.collection('apps')).then(coll => coll.deleteOne({id}))
	};
}

class ConfigAdapter {
	#configPromise = null;

	constructor() {
		this.#configPromise = smartConfig(configPath);
		this.#configPromise.then(c => c.defaults = {
			apps: [],
			sessions: [],
			auth: {},
			net: {},
			analytics: {}
		});
	}

	#kvStore = (name) => ({
		getAll: () => this.#configPromise.then(c => Object.entries(c).map(e => ({key: e[0], value: e[1]}))),
		get: (key) => this.#configPromise.then(c => c[name][key]),
		set: (key, value) => this.#configPromise.then(c => c[name][key] = value),
		clear: () => this.#configPromise.then(c => c[name] = {})
	});

	auth = this.#kvStore('auth');
	net = this.#kvStore('net');
	analytics = this.#kvStore('analytics');

	sessions = {
		getAll: () => this.#configPromise.then(c => c.sessions),
		getByID: (id) => this.#configPromise.then(c => c.sessions.find(s => s.id === id)),
		add: (app) => this.#configPromise.then(c => c.sessions.push(app)),
		update: (id, session) => this.#configPromise.then(c => c.sessions.splice(c.apps.findIndex(s => s.id === id), 1, session)),
		delete: (id) => this.#configPromise.then(c => c.sessions.splice(c.apps.findIndex(a => a.id === id))),
		deleteAll: () => this.#configPromise.then(c => c.sessions = [])
	};

	apps = {
		getAll: () => this.#configPromise.then(c => c.apps.sort((a1, a2) => a1.hosting.order - a2.hosting.order)),
		add: (app) => this.#configPromise.then(c => c.apps.push(app)),
		update: (id, app) => this.#configPromise.then(c => c.apps.splice(c.apps.findIndex(a => a.id === id), 1, app)),
		delete: (id) => this.#configPromise.then(c => c.apps.splice(c.apps.findIndex(a => a.id === id)))
	};
}

const adapter = fs.statSync(configPath, {throwIfNoEntry: false}) ? new ConfigAdapter() : new MongoAdapter();
module.exports = adapter;
