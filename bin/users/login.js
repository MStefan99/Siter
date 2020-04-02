const express = require('express');
const router = express.Router();
const bodyParser = require('body-parser');
const cookieParser = require('cookie-parser');
const Database = require('better-sqlite3');
const pbkdf2 = require('pbkdf2');
const uuid = require('uuid');


router.use(bodyParser.json());
router.use(bodyParser.urlencoded({extended: true}));
router.use(cookieParser());


const createUserTable = (db) => {
	db.prepare('create table users\
					(\
					id integer\
					constraint users_pk\
					primary key autoincrement,\
					username text not null,\
					pass_hash text not null,\
					cookie_id text\
					);').run();
	db.prepare('create unique index users_id_uindex\
				on users (id);').run();
	db.prepare('create unique index users_username_uindex\
				on users (username);').run();
};


router.post('/login', (req, res) => {
	const db = new Database('./database/users.sqlite');

	const tables = db.prepare('select name \
							 from sqlite_master \
						 	 where type=\'table\' \
							 and name=\'users\';').all();
	if (!tables.length) {  // creating the table if it's not present
		createUserTable(db);
	}
	const users = db.prepare('select *\
							  from users\
						      where username = ?').get(req.body.username);
	if (!users) {
		res.send('No users added! Please ask the owner of this server to add at least one user.');
	}

	db.close();
	res.json(users);
});


module.exports = router;
