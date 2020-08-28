'use strict';

const express = require('express');
const router = express.Router();
const bodyParser = require('body-parser');
const cookieParser = require('cookie-parser');
const flash = require('../lib/flash');
const libAuth = require('../lib/auth');
const libSession = require('../lib/session');
const middleware = require('../lib/middleware');


router.use(bodyParser.urlencoded({extended: true}));
router.use(cookieParser());
router.use(flash());


const cookieOptions = {
	httpOnly: true,
	secure: !process.env.NO_HTTPS,
	sameSite: 'strict',
};


router.use(middleware.getSession);


router.get('/about', (req, res) => {
	res.render('about');
});


router.get('/login', (req, res) => {
	res.render('user/login');
});


router.post('/login', async (req, res) => {
	if (!req.body.password) {
		res.flash({
			title: 'No password',
			info: 'Please enter the password to log in',
			type: 'error'
		})
		.redirect(303, '/login/');
	} else if (!await libAuth.verifyPassword(req.body.password)) {
		res.flash({
			title: 'Wrong password',
			info: 'You have entered the wrong password',
			type: 'error'
		})
		.redirect(303, '/login/');
	} else {
		const session = await libSession.createSession(req.ip, req.headers['user-agent']);

		res.cookie('siterSESSION', session.id, cookieOptions)
		.redirect('/');
	}
});


router.use(middleware.redirectIfNotAuthorized);


router.get('/logout', async (req, res) => {
	const session = await libSession.getSessionByID(req.cookies.siterSESSION);

	await session.delete();

	res.clearCookie('siterSESSION', cookieOptions)
	.redirect('/login/');
});


module.exports = router;
