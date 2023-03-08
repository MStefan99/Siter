'use strict';

const express = require('express');

const router = express.Router();
const cookieParser = require("cookie-parser");

const middleware = require('../lib/middleware');
const flash = require('@mstefan99/express-flash');


router.use(cookieParser());
router.use(flash());
router.use(middleware.getSession());


router.get('/about', (req, res) => {
	res.render('about');
});


router.get('/login', (req, res) => {
	res.render('login');
});


router.use(middleware.redirectIfNotAuthorized());


router.get('/', (req, res) => {
	res.redirect(303, '/dashboard');
});


router.get('/dashboard', (req, res) => {
	res.render('dashboard');
});


router.get('/settings', (req, res) => {
	res.render('settings');
});


module.exports = router;
