const express = require('express');
const router = express.Router();
const {redirectIfNotAuthorized} = require('./auth');


router.get('/about', (req, res) => {
	res.render('about');
});

router.get('/login', (req, res) => {
	res.render('user/login');
});

router.get('/register', (req, res) => {
	res.render('user/register');
});


router.use(redirectIfNotAuthorized);


// Functions below will be executed only for authorized users
router.get('/', (req, res) => {
	res.redirect(303, '/dashboard/')
});

router.get('/dashboard', (req, res) => {
	res.render('controls/dashboard');
});

router.get('/settings', (req, res) => {
	res.render('controls/settings');
});

router.get('/users', (req, res) => {
	res.render('controls/users');
});


module.exports = {pagesRouter: router};
