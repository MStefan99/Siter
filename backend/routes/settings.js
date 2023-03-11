'use strict';

const express = require('express');
const router = express.Router();
const bodyParser = require('body-parser');
const cookieParser = require('cookie-parser');

const libAuth = require('../lib/auth');
const libSession = require('../lib/session');
const flash = require('@mstefan99/express-flash');
const middleware = require('../lib/middleware');
const appManager = require('../lib/app_manager');


router.use(bodyParser.urlencoded({extended: true}));
router.use(cookieParser());
router.use(flash());
router.use(middleware.getSession());
router.use(middleware.redirectIfNotAuthorized());


router.get('/network', (req, res) => {
	res.json(appManager.getNetOptions());
});

router.get('/analytics', (req, res) => {
	res.json(appManager.getAnalyticsOptions());
});


router.post('/password', async (req, res) => {
	if (!req.body.newPassword || !req.body.newPasswordRepeat) {
		res.flash({
			title: 'Empty password',
			info: 'Please enter your new password to continue',
			type: 'warning'
		}).redirect(303, '/settings/');
		return;
	}
	if (!await libAuth.verifyPassword(req.body.password)) {
		res.flash({
			title: 'Wrong password',
			info: 'You have entered the wrong password, please try again',
			type: 'danger'
		}).redirect(303, '/settings/');
		return;
	}

	await libAuth.setPassword(req.body.newPassword);
	await libSession.deleteAllSessions();

	res.flash({
		title: 'Success!',
		info: 'You can now log in with a new password. ' +
			'You have been logged out on all devices.',
		type: 'success'
	}).redirect(303, '/login/');
});


router.post('/network', async (req, res) => {
	if (req.body.enabled &&
		(!req.body.cert || !req.body.key)) {
		res.flash({
			title: 'Could not enable HTTPS',
			info: 'Please provide certificate and key file',
			type: 'danger'
		}).redirect(303, '/settings/');
		return;
	}
	if (req.body.redirect && !req.body.enabled) {
		res.flash({
			title: 'Could not enable redirect',
			info: 'To enable redirect, please enable HTTPS support first',
			type: 'danger'
		}).redirect(303, '/settings/');
		return;
	}

	await appManager.setNetOptions({
		httpPort: +req.body.httpPort,
		httpsPort: +req.body.httpsPort,
		httpsEnabled: !!req.body.httpsEnabled,
		httpsRedirect: !!req.body.httpsRedirect,
		cert: req.body.cert,
		key: req.body.key
	});
	res.flash({
		title: 'Success!',
		info: 'Your security options have been saved.',
		type: 'success'
	})
		.redirect(303, '/settings');
});

router.post('/analytics', async (req, res) => {
	if (req.body.enabled && (!req.body.url || !req.body.key)) {
		res.flash({
			title: 'Could not enable analytics',
			info: 'Please provide both url and key',
			type: 'danger'
		}).redirect(303, '/settings/');
		return;
	}

	await appManager.setAnalyticsOptions({
		enabled: req.body.enabled,
		url: req.body.url,
		key: req.body.key
	});
	res.flash({
		title: 'Success!',
		info: 'Your analytics options have been saved.',
		type: 'success'
	})
		.redirect(303, '/settings');
});


module.exports = router;
