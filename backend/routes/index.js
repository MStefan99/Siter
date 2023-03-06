'use strict';

const express = require('express');

const router = express.Router();
const middleware = require('../lib/middleware');

const appManager = require('../lib/app_manager');


router.use(middleware.getSession());
router.use(middleware.redirectIfNotAuthorized());


router.get('/', (req, res) => {
	res.redirect(303, '/dashboard/');
});


router.get('/dashboard', (req, res) => {
	res.render('dashboard', {
		secure: !!appManager.getNetOptions().httpsEnabled
	});
});


router.get('/settings', (req, res) => {
	res.render('settings');
});


module.exports = router;
