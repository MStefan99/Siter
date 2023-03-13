'use strict';

const express = require('express');
const router = express.Router();

const appManager = require('../lib/app_manager');
const middleware = require("../lib/middleware");
const bodyParser = require("body-parser");
const cookieParser = require("cookie-parser");
const {validate} = require("../../common/validate");


router.use(bodyParser.json());
router.use(cookieParser());
router.use(middleware.getSession());
router.use(middleware.redirectIfNotAuthorized());


router.get('/', (req, res) => {
	res.json(appManager.getApps());
});


router.post('/', async (req, res) => {
	if (!req.body) {
		res.status(400).send('No route provided');
		return;
	}
	if (!validate(req.body).valid) {
		res.status(400).send('Invalid app');
		return;
	}

	const route = await appManager.addApp(req.body);
	res.status(201).json(route);
});


router.put('/:id', async (req, res) => {
	if (!req.params.id) {
		res.status(400).send('No ID provided');
		return;
	}
	if (!req.body) {
		res.status(400).send('No route provided');
		return;
	}
	if (!validate(req.body).valid) {
		res.status(400).send('Invalid app');
		return;
	}

	const newRoute = await appManager.updateApp(
		req.params.id,
		req.body);
	res.json(newRoute);
});


router.delete('/:id', async (req, res) => {
	if (!req.params.id) {
		res.status(400).send('No ID provided');
		return;
	}

	await appManager.removeApp(req.params.id);
	res.sendStatus(200);
});


router.post('/reorder', async (req, res) => {
	if (!req.body) {
		res.status(400).send('Invalid order');
		return;
	}

	await appManager.reorder(req.body);
	res.sendStatus(200);
});


module.exports = router;
