const express = require('express');
const router = express.Router();


router.get('/', (req, res) => {
	res.render('index', {main: "main"});
});

router.get('/login', (req, res) => {
	res.render('user/login');
});


module.exports = router;
