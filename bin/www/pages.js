const express = require('express');
const router = express.Router();
const cookieParser = require('cookie-parser');

router.use(cookieParser());


// general pages
router.get('/', (req, res) => {
	if (!req.cookies['siterID']) {
		res.redirect(307, '/login/');
	} else {
		res.redirect(307, '/dashboard/');
	}
});


router.get('/about', (req, res) => {
	res.render('about');
});


// user pages
router.get('/login', (req, res) => {
	res.render('user/login');
});

router.get('/register', (req, res) => {
	res.render('user/register');
});


// control pages
router.get('/dashboard', (req, res) => {
	if (req.cookies['siterID']) {
		res.render('controls/dashboard');
	} else  {
		res.redirect(307, '/login/');
	}
});


module.exports = router;
