const express = require('express');
const router = express.Router();
const bodyParser = require('body-parser');
const cookieParser = require('cookie-parser');
const crypto = require('crypto');
const uuid = require('uuid');
const fs = require('fs');
const openDB = require('bin/db');


router.use(bodyParser.json());
router.use(bodyParser.urlencoded({extended: true}));
router.use(cookieParser());


const initUserTables = async (db) => {
	await db.run(fs.readFileSync('database/ddl/users.sql').toString());
};


router.post('/login', async (req, res) => {
	await openDB(async db => {
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
		} else {
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
		}
		
		await db.close();
	});
});


router.get('/logout', async (req, res) => {
	await openDB(async db => {
		const sessionID = req.cookies['siterID'];
		res.clearCookie('siterID', {httpOnly: true, sameSite: 'Strict'}).redirect(307, '/login/');
		
		await db.run(`delete from sessions
			where cookie_id = $cid`, {$cid: sessionID});
		
		await db.close();
	});
});


module.exports = router;
