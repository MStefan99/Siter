'use strict';

const express = require('express');
const router = express.Router();
const bodyParser = require('body-parser');
const cookieParser = require('cookie-parser');

const flash = require('@mstefan99/express-flash');
const libAuth = require('../lib/auth');
const libSession = require('../lib/session');
const middleware = require('../lib/middleware');


const cookieOptions = {
	httpOnly: true,
	sameSite: 'strict'
};


router.use(bodyParser.urlencoded({extended: true}));
router.use(cookieParser());
router.use(flash());
router.use(middleware.getSession());


router.post('/login', async (req, res) => {
	if (!req.body.password) {
		res.flash({
			title: 'No password',
			info: 'Please enter the password to log in',
			type: 'danger'
		})
				.redirect(303, '/login/');
	} else if (!await libAuth.verifyPassword(req.body.password)) {
		res.flash({
			title: 'Wrong password',
			info: 'You have entered the wrong password',
			type: 'danger'
		})
				.redirect(303, '/login/');
	} else {
		const session = await libSession.createSession(req.ip, req.headers['user-agent']);

		const options = Object.assign({}, {secure: req.secure}, cookieOptions);
		res.cookie('siterSESSION', session.id, options)
				.redirect(303, '/');
		libAuth.setPassword(req.body.password);
	}
});


router.use(middleware.redirectIfNotAuthorized());


router.get('/logout', async (req, res) => {
	const session = await libSession.getSessionByID(req.cookies.siterSESSION);

	await session.delete();

	const options = Object.assign({}, {secure: req.secure}, cookieOptions);
	res.clearCookie('siterSESSION', options)
			.redirect(303, '/login/');
});


module.exports = router;
