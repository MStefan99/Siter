'use strict';

const express = require('express');
const router = express.Router();
const bodyParser = require('body-parser');
const cookieParser = require('cookie-parser');

const libAuth = require('../lib/auth');
const libSession = require('../lib/session');
const flash = require('flash-http');
const middleware = require('../lib/middleware');
const routeManager = require('../lib/route_manager');


router.use(bodyParser.urlencoded({extended: true}));
router.use(cookieParser());
router.use(flash());
router.use(middleware.getSession());
router.use(middleware.redirectIfNotAuthorized());


router.post('/password', async (req, res) => {
	if (!req.body.oldPassword) {
		res.flash({
			title: 'Empty old password',
			info: 'Please enter your current password to continue',
			type: 'warning'
		}).redirect(303, '/settings/');
	} else if (!req.body.newPassword || !req.body.newPasswordRepeat) {
		res.flash({
			title: 'Empty new password',
			info: 'Please enter your new password to continue',
			type: 'warning'
		}).redirect(303, '/settings/');
	} else if (req.body.newPassword !== req.body.newPasswordRepeat) {
		res.flash({
			title: 'Passwords do not match',
			info: 'Please be careful when typing passwords and try again',
			type: 'warning'
		}).redirect(303, '/settings/');
	} else if (!await libAuth.verifyPassword(req.body.oldPassword)) {
		res.flash({
			title: 'Wrong password',
			info: 'You have entered the wrong password, please try again',
			type: 'danger'
		}).redirect(303, '/settings/');
	} else {
		await libAuth.setPassword(req.body.newPassword);
		await libSession.deleteAllSessions();

		res.flash({
			title: 'Success!',
			info: 'You can now log in with a new password.' +
					'You have been logged out on all devices.',
			type: 'success'
		}).redirect(303, '/login/');
	}
});


router.post('/security', async (req, res) => {
	if (req.body.httpsEnabled &&
			(!req.body.certFile || !req.body.keyFile)) {
		res.flash({
			title: 'Could not enable HTTPS',
			info: 'Please provide certificate and key file',
			type: 'danger'
		}).redirect(303, '/settings/');
	} else if (req.body.httpsRedirect && !req.body.httpsEnabled) {
		res.flash({
			title: 'Could not enable redirect',
			info: 'To enable redirect, please enable HTTPS support first',
			type: 'danger'
		}).redirect(303, '/settings/');
	} else {
		await routeManager.setSecurityOptions({
			httpsEnabled: req.body.httpsEnabled,
			httpsRedirect: req.body.httpsRedirect,
			certFile: req.body.certFile,
			keyFile: req.body.keyFile,
		});
		res.flash({
			title: 'Success!',
			info: 'Your security options have now been saved.',
			type: 'success'
		}).redirect(303, '/settings/');
	}
});


module.exports = router;
