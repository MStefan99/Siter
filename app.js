'use strict';

const path = require('path');
const express = require('express');

const routeManager = require('./src/lib/route_manager');
const indexRouter = require('./src/routes/index');
const authRouter = require('./src/routes/auth');
const apiRouter = require('./src/api/router');

const app = express();


app.set('view engine', 'pug');
app.set('views', path.join(__dirname, 'views'));

app.use('/', express.static(path.join(__dirname, 'public')));
app.use('/favicon.ico', express.static(path
	.join(__dirname, 'public', 'img', 'icon.svg')));
app.use('/api', apiRouter);
app.use(authRouter);
app.use(indexRouter);


require('./src/lib/init').init().then(() => {
	routeManager.start(app);
});
