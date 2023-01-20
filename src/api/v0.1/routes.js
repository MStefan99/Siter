'use strict';

const express = require('express');
const router = express.Router();

const routeManager = require('../../lib/route_manager');


router.get('/', (req, res) => {
	res.json(routeManager.getRoutes());
});


router.post('/', (req, res) => {
	if (!req.body.route) {
		res.status(400).send('No route provided');
	}

	const route = routeManager.addRoute(req.body.route);
	res.status(201).json(route);
});


router.put('/:routeID', (req, res) => {
	if (!req.params.routeID) {
		res.status(400).send('No ID provided');
	}
	if (!req.body.route) {
		res.status(400).send('No route provided');
	}

	const newRoute = routeManager.updateRoute(
		req.params.routeID,
		req.body.route);
	res.json(newRoute);
});


router.delete('/:routeID', (req, res) => {
	if (!req.params.routeID) {
		res.status(400).send('No ID provided');
	}

	routeManager.removeRoute(req.params.routeID);
	res.sendStatus(200);
});


router.post('/reorder', (req, res) => {
	if (!req.body) {
		res.status(400).send('Invalid order');
	}

	routeManager.reorder(req.body);
	res.sendStatus(200);
});


module.exports = router;
