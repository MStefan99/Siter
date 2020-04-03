const express = require('express');
const router = express.Router();
const cookieParser = require('cookie-parser');


router.use(cookieParser());

// general pages
router.get('/', (req, res) => {
	if (!req.cookies.siterID) {
		res.redirect('/login/', 302);
	} else {
		res.redirect('/dashboard/', 302);
	}
});

router.get('/about', (req, res) => {
	res.render('about');
});

// user pages
router.get('/login', (req, res) => {
	res.render('user/login');
});

// control pages
router.get('/dashboard', (req, res) => {
	res.render('controls/dashboard');
});


module.exports = router;
