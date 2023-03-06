'use strict';

process.on('unhandledRejection', (reason, promise) => {
	console.error('Unhandled Rejection: ', reason);
	process.exit(~0x1);
});


process.on('uncaughtException', (err, origin) => {
	console.error('Uncaught exception: ', err);
	process.exit(~0x0);
});


const path = require('path');
const express = require('express');

const appManager = require('./lib/app_manager');

const indexRouter = require('./routes');
const authRouter = require('./routes/auth');
const settingsRouter = require('./routes/settings');
const apiRouter = require('./api/router');

const app = express();


app.set('view engine', 'pug');
app.set('views', path.join(__dirname, 'views'));
app.set('x-powered-by', false);

app.use((req, res, next) => {
	res.set('X-Content-Type-Options', 'nosniff');
	res.set('Cache-Control', 'no-cache');
	next();
});

app.use('/', express.static(path.join(__dirname, '..', 'frontend', 'public'), {
	setHeaders(res) {
		res.set('Cache-Control', 'max-age=31536000 immutable public')
	}
}));

app.use('/api', apiRouter);
app.use(authRouter);
app.use(settingsRouter);
app.use(indexRouter);


app.use((err, req, res, next) => {
	console.error(err);

	res.status(500).sendFile(path.join(__dirname, 'views/standalone/internal.html'));
});


require('./lib/init').init().then(() => {
	appManager.start(app);
	console.log('Siter is now running! Open http://siter.localhost/ to get started.');
});
