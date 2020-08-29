'use strict';

const express = require('express');

const routeManager = require('../../lib/routeManager');

const router = express.Router();


router.get('/', (req, res) => {
	res.json(routeManager.getRoutes());
});


router.post('/', async (req, res) => {
	if (!req.body.route) {
		res.status(400).send('No route provided');
	}

	const route = await routeManager.addRoute(req.body.route);
	res.status(201).json(route);
});


router.put('/:routeID', async (req, res) => {
	if (!req.params.routeID) {
		res.status(400).send('No ID provided');
	}
	if (!req.body.route) {
		res.status(400).send('No route provided');
	}

	const newRoute = await routeManager.updateRoute(
		parseInt(req.params.routeID),
		req.body.route);
	res.json(newRoute);
});


router.delete('/:routeID', async (req, res) => {
	if (!req.params.routeID) {
		res.status(400).send('No ID provided');
	}

	await routeManager.removeRoute(req.params.routeID);
	res.sendStatus(200);
});


module.exports = router;
