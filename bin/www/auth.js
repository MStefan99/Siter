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

async function sessionExists(cookie) {
	const db = await openDB();
	const user = await db.get(`select *
                               from sessions s
                                        left join users u on s.user_id = u.id
                               where s.cookie_id = $cookieId`, {$cookieId: cookie});
	return !!user;
}

async function isAdmin(cookie) {
	const db = await openDB();
	const user = await db.get(`select *
                               from sessions s
                                        left join users u on s.user_id = u.id
                               where s.cookie_id = $cookieId`, {$cookieId: cookie});
	return !!user['is_admin'];
}

async function redirectIfNotAuthorized(req, res, next) {
	if (await sessionExists(req.cookies['siterID'])) {
		next();
	} else {
		res.redirect(303, '/login/');
	}
}


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
			res.render('message', {message: 'Wrong password! Please try again.'});
		}
	} else {
		res.render('message', {message: 'User not found! Please check if you have access to this server'});
	}
	await db.close();
});


router.get('/logout', async (req, res) => {
	const db = await openDB();
	const sessionID = req.cookies['siterID'];
	res.clearCookie('siterID', {httpOnly: true, sameSite: 'Strict'}).redirect(303, '/login/');

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
		res.render('message', {message: 'Passwords do not match. Please try again'});
	} else if (rows) {
		if (req.body['password'].length >= 8) {
			const hash = crypto.createHash('sha512')
				.update(req.body['password'])
				.digest('hex');
			await db.run(`update users
                          set password_hash=$hash,
                              setup_code=null
                          where setup_code = $code`, {$hash: hash, $code: req.body['sitercode']});
			res.render('message', {message: 'Success! Your username is: ' + rows['username']});

		} else {
			res.render('message', {message: 'Your password has to be at least 8 characters long!'});
		}
	} else {
		res.render('message', {message: 'SiterCODE not found. Please check if the code is correct.'});
	}
});


module.exports = {
	authRouter: router,
	redirectIfNotAuthorized: redirectIfNotAuthorized,
	isAdmin: isAdmin
};
