const express = require('express');
const router = express.Router();
const cookieParser = require('cookie-parser');
const openDB = require('../db');

router.use(cookieParser());

async function sessionExists(req) {
	const db = await openDB();
	const cookie = req.cookies['siterID'];
	const user = await db.get(`select *
                               from sessions s
                                        left join users u on s.user_id = u.id
                               where s.cookie_id = $cookieId`, {$cookieId: cookie});
	if (user) {
		req.user = {id: user['id']};
		return true;
	} else {
		return false;
	}
}

async function redirectIfNotAuthorized(req, res, next) {
	if (!await sessionExists(req)) {
		res.redirect(303, '/login/');
	} else {
		next();
	}
}

router.get('/about', (req, res) => {
	res.render('about');
});

router.get('/login', (req, res) => {
	res.render('user/login');
});

router.get('/register', (req, res) => {
	res.render('user/register');
});


router.use(redirectIfNotAuthorized);


// Functions below will be executed only for authorized users
router.get('/', (req, res) => {
	res.redirect(303, '/dashboard/')
});

router.get('/dashboard', (req, res) => {
	res.render('controls/dashboard');
});

router.get('/settings', (req, res) => {
	res.render('controls/settings');
});

router.get('/users', (req, res) => {
	res.render('controls/users');
});


module.exports = {pagesRouter: router};
