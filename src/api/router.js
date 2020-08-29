'use strict';

const express = require('express');

const apiV0_1Router = require('./v0.1/router');

const router = express.Router();
router.use('/v0.1', apiV0_1Router);


module.exports = router;
