'use strict';

const express = require('express');
const router = express.Router();

const appManager = require('../lib/app_manager');
const middleware = require("../lib/middleware");
const bodyParser = require("body-parser");
const cookieParser = require("cookie-parser");


router.use(bodyParser.json());
router.use(cookieParser());
router.use(middleware.getSession());
router.use(middleware.redirectIfNotAuthorized());


router.get('/', (req, res) => {
	res.json(appManager.getApps());
});


router.post('/', (req, res) => {
	if (!req.body.route) {
		res.status(400).send('No route provided');
	}

	const route = appManager.addApp(req.body);
	res.status(201).json(route);
});


router.put('/:id', (req, res) => {
	if (!req.params.id) {
		res.status(400).send('No ID provided');
	}
	if (!req.body.route) {
		res.status(400).send('No route provided');
	}

	const newRoute = appManager.updateApp(
		req.params.id,
		req.body);
	res.json(newRoute);
});


router.delete('/:id', (req, res) => {
	if (!req.params.id) {
		res.status(400).send('No ID provided');
	}

	appManager.removeApp(req.params.id);
	res.sendStatus(200);
});


router.post('/reorder', (req, res) => {
	if (!req.body) {
		res.status(400).send('Invalid order');
	}

	appManager.reorder(req.body);
	res.sendStatus(200);
});


module.exports = router;
