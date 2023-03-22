'use strict';

const {MongoClient} = require('mongodb');
const url = 'mongodb://127.0.0.1:27017';
const client = new MongoClient(url);

const dbPromise = client.connect().then(conn => conn.db('siter'));

module.exports = (name) => dbPromise.then(db => db.collection(name));
