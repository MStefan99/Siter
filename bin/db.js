const sqlite = require('sqlite');
const sqlite3 = require('sqlite3');


openDB = async (success, error) => {
	await sqlite.open({
		filename: 'database/users.sqlite',
		driver: sqlite3.Database
	}).then(async db => {
		await db.run(`pragma foreign_keys = on;`);
		success(db)
	}, err => {
		console.error(`Database open error: ${err}`);
		error(err);
	}).catch(exception => {
		console.error(`The following exception occurred while opening the database: ${exception}`);
	});
};


module.exports = openDB;
