const express = require('express');
const router = express.Router();
const bodyParser = require('body-parser');
const cookieParser = require('cookie-parser');
const sqlite = require('sqlite');
const sqlite3 = require('sqlite3');
const crypto = require('crypto');
const uuid = require('uuid');


router.use(bodyParser.json());
router.use(bodyParser.urlencoded({extended: true}));
router.use(cookieParser());


const initUserTables = async (db) => {
	// Creating table for users
	await db.run(`create table users (
				id integer not null
			constraint users_pk
			primary key autoincrement,
				username text not null,
				password_hash text,
				setup_code text,
				is_admin integer default 0 not null,
				can_manage_users integer default 0 not null
			
			create unique index users_id_uindex
				on users (id);
			
			create unique index users_setup_code_uindex
			on users (setup_code);
			
			create unique index users_username_uindex
			on users (username);
			`);
	
	// Creating table for user sessions
	await db.run(`create table sessions (
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
			
			create unique index sessions_id_uindex
				on sessions (id);
			
			create unique index sessions_user_id_uindex
				on sessions (user_id);`);
};


router.post('/login', async (req, res) => {
	await sqlite.open({
		filename: 'database/users.sqlite',
		driver: sqlite3.Database
	}).then(async db => {
		const tables = await db.all(`select name \
								from sqlite_master \
								where type='table' \
								and name='users';`);
		if (!tables.length) {
			await initUserTables(db);  // creating the table if it's not present
		}
		const users = await db.get('select *\
											from users\
											where username = $un', {$un: req.body.username});
		if (!users) {
			res.send('User not found! Please check if you have access to this server');
		}
		
		const hash = crypto.createHash('sha512')
			.update(req.body.password)
			.digest('hex');
		if (users['password_hash'] === hash) {
			const sessionID = uuid.v4();
			res.cookie('siterID', sessionID, {httpOnly: true, sameSite: 'Strict'})
				.redirect(303, '/dashboard/');
			await db.run(`insert into sessions (user_id, cookie_id, ip_address, os, last_login) 
					values ($uid, $cid, $ip, $os, $ll)`, {
				$uid: users['id'], $cid: sessionID, $os: req.headers['user-agent'],
				$ip: req.connection.remoteAddress, $ll: Date.now()
			});
		} else {
			res.send('Wrong password! Please try again.');
		}
		
		await db.close();
	});
});


router.get('/logout', async (req, res) => {
	await sqlite.open({
		filename: 'database/users.sqlite',
		driver: sqlite3.Database
	}).then(async db => {
		const sessionID = req.cookies['siterID'];
		res.clearCookie('siterID', {httpOnly: true, sameSite: 'Strict'}).redirect(307, '/login/');
		
		await db.run(`delete from sessions
			where cookie_id = $cid`, {$cid: sessionID});
		
		await db.close();
	});
});


module.exports = router;
