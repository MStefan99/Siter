'use strict';

const express = require('express');

const router = express.Router();
const middleware = require('../lib/middleware');

const routeManager = require('../lib/route_manager');


router.use(middleware.getSession());
router.use(middleware.redirectIfNotAuthorized());


router.get('/', (req, res) => {
	res.redirect(303, '/dashboard/')
});


router.get('/dashboard', (req, res) => {
	res.render('dashboard', {
		secure: !!routeManager.getSecurityOptions().httpsEnabled
	});
});


router.get('/settings', (req, res) => {
	res.render('settings');
});


module.exports = router;
