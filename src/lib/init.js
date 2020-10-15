'use strict';

const fs = require('fs');
const util = require('util');
const path = require('path');

const openDB = require('./db');
const auth = require('./auth');

const readFile = util.promisify(fs.readFile);

const ddlDir = path.join(__dirname, '..', '..', 'database', 'ddl');


async function init() {
	const db = await openDB();

	const tables = await db.all(`select *
                               from sqlite_master
                               where type='table'`);

	if (!tables.find(table => table.name === 'options')) {
		await db.run(await readFile(path
			.join(ddlDir, 'options.sql'), 'utf-8'));
		await auth.init();
	}
	if (!tables.find(table => table.name === 'sessions')) {
		await db.run(await readFile(path
			.join(ddlDir, 'sessions.sql'), 'utf-8'));
	}
	if (!tables.find(table => table.name === 'routes')) {
		await db.run(await readFile(path
			.join(ddlDir, 'routes.sql'), 'utf-8'));
	}
}


module.exports = {
	init: init,
};
