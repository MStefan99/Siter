'use strict';

const express = require('express');
const cookieParser = require('cookie-parser');
const bodyParser = require('body-parser');

const routeRouter = require('./routes');
const middleware = require('../../lib/middleware');

const router = express.Router();


router.use(cookieParser());
router.use(bodyParser.json());
router.use(middleware.getSession);

router.use((req, res, next) => {
	if (!req.session) {
		res.status(403).send('Not authorized');
	} else {
		next();
	}
});

router.use('/routes', routeRouter);


router.all('/', (req, res) => {
	res.send('Welcome to Siter API v0.1!');
});


module.exports = router;
