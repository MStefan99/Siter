'use strict';

const express = require('express');
const router = express.Router();

const appManager = require('../lib/app_manager');


router.get('/', (req, res) => {
	res.json(appManager.getApps());
});


router.post('/', (req, res) => {
	if (!req.body.route) {
		res.status(400).send('No route provided');
	}

	const route = appManager.addApp(req.body.route);
	res.status(201).json(route);
});


router.put('/:routeID', (req, res) => {
	if (!req.params.routeID) {
		res.status(400).send('No ID provided');
	}
	if (!req.body.route) {
		res.status(400).send('No route provided');
	}

	const newRoute = appManager.updateApp(
		req.params.routeID,
		req.body.route);
	res.json(newRoute);
});


router.delete('/:routeID', (req, res) => {
	if (!req.params.routeID) {
		res.status(400).send('No ID provided');
	}

	appManager.removeApp(req.params.routeID);
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
