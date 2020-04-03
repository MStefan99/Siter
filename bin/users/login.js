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


const initUserTables = (db) => {
	// Creating table for users
	db.prepare(`create table users (
						id integer not null
					constraint users_pk
					primary key autoincrement,
						username text not null,
						password_hash text,
						setup_code text,
						is_admin integer default 0 not null,
						can_manage_users integer default 0 not null
				);
				`).run();
	db.prepare(`create unique index users_id_uindex
					on users (id);`).run();
	db.prepare(`create unique index users_setup_code_uindex
					on users (setup_code);`).run();
	db.prepare(`create unique index users_username_uindex
					on users (username);`).run();

	// Creating table for user sessions
	db.prepare(`create table sessions (
					id integer
				constraint sessions_pk
				primary key autoincrement,
					user_id integer not null
				constraint user_id___fk
				references users
				on update restrict,
					cookie_id text not null,
					ip_address text not null,
					os text not null,
					last_login text not null
				);
			`).run();
	db.prepare(`create unique index sessions_id_uindex
					on sessions (id);`).run();
	db.prepare(`create unique index sessions_user_id_uindex
					on sessions (user_id);`).run();
};


router.post('/login', (req, res) => {
	const db = new Database('./database/users.sqlite');

	const tables = db.prepare('select name \
							 from sqlite_master \
							 where type=\'table\' \
							 and name=\'users\';').all();
	if (!tables.length) {
		initUserTables(db);  // creating the table if it's not present
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
