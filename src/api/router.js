'use strict';

const express = require('express');
const router = express.Router();


const apiV0_1Router = require('./v0.1/router');


router.use('/v0.1', apiV0_1Router);


module.exports = router;
