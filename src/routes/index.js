'use strict';

const express = require('express');

const router = express.Router();
const middleware = require('../lib/middleware');


router.use(middleware.getSession);
router.use(middleware.redirectIfNotAuthorized);


router.get('/', (req, res) => {
	res.redirect(303, '/dashboard/')
});


router.get('/dashboard', (req, res) => {
	res.render('dashboard');
});


module.exports = router;
