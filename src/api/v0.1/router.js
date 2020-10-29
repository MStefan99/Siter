'use strict';

const express = require('express');
const router = express.Router();
const bodyParser = require('body-parser');
const cookieParser = require('cookie-parser');

const middleware = require('../../lib/middleware');
const routeRouter = require('./routes');


router.use(cookieParser());
router.use(bodyParser.json());
router.use(middleware.getSession());
router.use(middleware.rejectIfNotAuthorized());

router.use('/routes', routeRouter);


router.all('/', (req, res) => {
	res.send('Welcome to Siter API v0.1!');
});


module.exports = router;
