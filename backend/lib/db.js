'use strict';

const {MongoClient} = require('mongodb');
const url = 'mongodb://localhost:27017';
const client = new MongoClient(url);

const dbPromise = client.connect().then(conn => conn.db('siter'));

module.exports = (name) => dbPromise.then(db => db.collection(name));
