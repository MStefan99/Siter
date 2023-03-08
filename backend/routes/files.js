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


router.get('/', async (req, res) => {
	const pathname = req.query.path?.length ? req.query.path.toString() : '/';

	const data = {};

	try {
		const stat = await fs.stat(pathname);

		data.dir = stat.isDirectory();
	} catch (err) {
		res.status(422).send(err.code);
		return;
	}

	const files = await fs.readdir(data.dir ? pathname : path.dirname(pathname), {withFileTypes: true});
	data.files = files.map(f => {
		return {name: path.sep + f.name, dir: f.isDirectory()}
	});

	res.json(data);
});


module.exports = router;
