const express = require('express');
const router = express.Router();
const bodyParser = require('body-parser');
const cookieParser = require('cookie-parser');
const crypto = require('crypto');
const uuid = require('uuid');
const path = require('path');
const fs = require('fs');
const openDB = require('../db');


router.use(bodyParser.urlencoded({extended: true}));
router.use(cookieParser());


const initUserTables = async (db) => {
	await db.run(fs.readFileSync(path.join(__dirname, 'database/ddl/users.sql')).toString());
};


router.post('/login', async (req, res) => {
	const db = await openDB();
	const tables = await db.get(`select name
                                 from sqlite_master
                                 where type = 'table'
                                   and name = 'users';`);
	if (!tables) {
		await initUserTables(db);  // creating the table if it's not present
	}
	const users = await db.get(`select *
                                from users
                                where username = $un`, {$un: req.body.username});
	if (users) {
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
	} else {
		res.send('User not found! Please check if you have access to this server');
	}
	await db.close();
});


router.get('/logout', async (req, res) => {
	const db = await openDB();
	const sessionID = req.cookies['siterID'];
	res.clearCookie('siterID', {httpOnly: true, sameSite: 'Strict'}).redirect(307, '/login/');
	
	await db.run(`delete
                  from sessions
                  where cookie_id = $cid`, {$cid: sessionID});
	await db.close();
});


router.post('/register', async (req, res) => {
	const db = await openDB();
	let rows = await db.get(`select id, username
                             from users
                             where setup_code = $code`, {$code: req.body['sitercode']});
	if (req.body['password'] !== req.body['password-repeat']) {
		res.send('Passwords do not match. Please try again');
	} else if (rows) {
		const hash = crypto.createHash('sha512')
			.update(req.body['password'])
			.digest('hex');
		await db.run(`update users
                      set password_hash=$hash,
                          setup_code=null
                      where setup_code = $code`, {$hash: hash, $code: req.body['sitercode']});
		res.send('Success! Now log in with your new password!');
	} else {
		res.send('SiterCODE not found. Please check if the code is correct.');
	}
});


module.exports = router;
