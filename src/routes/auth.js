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
	res.render('login');
});


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


router.post('/settings', async (req, res) => {
	if (!req.body.oldPassword) {
		res.flash({
			title: 'Empty old password',
			info: 'Please enter your current password to continue',
			type: 'warning'
		}).redirect('/settings/');
	} else if (!req.body.newPassword || !req.body.newPasswordRepeat) {
		res.flash({
			title: 'Empty new password',
			info: 'Please enter your new password to continue',
			type: 'warning'
		}).redirect('/settings/');
	} else if (req.body.newPassword !== req.body.newPasswordRepeat) {
		res.flash({
			title: 'Passwords do not match',
			info: 'Please be careful when typing passwords and try again',
			type: 'warning'
		}).redirect('/settings/');
	} else if (!await libAuth.verifyPassword(req.body.oldPassword)) {
		res.flash({
			title: 'Wrong password',
			info: 'You have entered the wrong password, please try again',
			type: 'danger'
		}).redirect('/settings/');
	} else {
		await libAuth.setPassword(req.body.newPassword);
		await libSession.deleteAllSessions();

		res.flash({
			title: 'Success!',
			info: 'You can now log in with a new password.' +
				'You have been logged out on all devices.',
			type: 'success'
		}).redirect('/login/');
	}
});


module.exports = router;
