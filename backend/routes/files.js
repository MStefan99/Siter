'use strict';

const express = require('express');
const path = require('path');
const fs = require('fs').promises;

const router = express.Router();
const middleware = require('../lib/middleware');
const cookieParser = require("cookie-parser");


router.use(cookieParser());
router.use(middleware.getSession());
router.use(middleware.redirectIfNotAuthorized());


router.get('/files', async (req, res) => {
	const dirname = req.query.path?.length? req.query.path.toString() : '/';

	try {
		res.send((await fs.readdir(dirname)).map(f => path.sep + f));
	} catch (err) {
		res.status(422).send(err.code);
	}
});


module.exports = router;
