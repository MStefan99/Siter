'use strict';

const path = require('path');
const express = require('express');

const app = express();

const indexRouter = require('./src/routes/index');
const authRouter = require('./src/routes/auth');

app.set('view engine', 'pug');
app.set('views', path.join(__dirname, 'views'));


app.use('/', express.static(path.join(__dirname, 'static')));
app.use(authRouter);
app.use(indexRouter);


module.exports = app;
