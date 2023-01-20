'use strict';

const express = require('express');
const router = express.Router();

const routeManager = require('../lib/route_manager');


router.get('/https', (req, res) => {
	res.json(routeManager.getNetOptions());
});


module.exports = router;
