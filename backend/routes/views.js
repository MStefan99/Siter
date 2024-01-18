'use strict';

const express = require('express');

const router = express.Router();
const cookieParser = require("cookie-parser");

const middleware = require('../lib/middleware');
const flash = require('../lib/express-flash');
const appManager = require('../lib/app_manager');
const {getSession} = require("../lib/middleware");


router.use(cookieParser());
router.use(flash());
router.use(middleware.getSession());

router.use((req, res, next) => {
	res.locals.net = appManager.getNetOptions();
	res.locals.analytics = appManager.getAnalyticsOptions();
	next();
});

router.get('/about', (req, res) => {
	res.render('about');
});

router.get('/login', (req, res) => {
	res.render('login', {secure: req.secure});
});

router.get('/challenge', getSession(), (req, res) => {
	res.render('challenge', {question: req.session.challenge.question, secure: req.secure});
});

router.use(middleware.redirectIfNotAuthorized());

router.get('/', (req, res) => {
	res.redirect(303, '/dashboard');
});

router.get('/dashboard', (req, res) => {
	res.render('dashboard', {dev: process.env.NODE_ENV === 'dev'});
});

router.get('/settings', (req, res) => {
	res.render('settings');
});


module.exports = router;
