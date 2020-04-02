const express = require('express');
const router = express.Router();
const bodyParser = require('body-parser');
const cookieParser = require('cookie-parser');

router.use(bodyParser.json());
router.use(bodyParser.urlencoded({ extended: true }));
router.use(cookieParser());


router.get('/login', (req, res) => {
	res.render('user/login');
});


router.post('/login', (req, res) => {
	res
		.cookie('siterID', req.body.username, {maxAge: 3600, domain: 'localhost', path: '/login'})
		.send('let\'s pretend you\'re logged in');
});

module.exports = router;
