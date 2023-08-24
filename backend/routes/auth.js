'use strict';

const express = require('express');
const router = express.Router();
const bodyParser = require('body-parser');
const cookieParser = require('cookie-parser');

const flash = require('@mstefan99/express-flash');
const libAuth = require('../lib/auth');
const libSession = require('../lib/session');
const middleware = require('../lib/middleware');
const {getRandomChallenge, verifyChallenge} = require("../lib/auth");


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
			.redirect(303, '/login');
		return;
	}
	if (!await libAuth.verifyPassword(req.body.password)) {
		res.flash({
			title: 'Wrong password',
			info: 'You have entered the wrong password',
			type: 'danger'
		})
			.redirect(303, '/login');
		return;
	}

	const challenge = await getRandomChallenge();
	const session = await libSession.createSession(req.ip, req.headers['user-agent'], challenge);

	const options = Object.assign({}, {secure: req.secure}, cookieOptions);
	res.cookie('siter-session', session.id, options)
		.redirect(303, '/');
});

router.post('/challenge', async (req, res) => {
	const session = req.session;

	if (!verifyChallenge(session.challenge, req.body.answer)) {
		res.flash({
			title: 'Wrong answer',
			info: 'You have entered the wrong verification answer',
			type: 'danger'
		})
			.redirect(303, '/login');

		await req.session.delete();
		return;
	}
	delete (session.challenge);
	session.save();

	res.redirect(303, '/');
});


router.use(middleware.redirectIfNotAuthorized());


router.get('/logout', async (req, res) => {
	await req.session.delete();

	const options = Object.assign({}, {secure: req.secure}, cookieOptions);
	res.clearCookie('siter-session', options)
		.redirect(303, '/login');
});


module.exports = router;
