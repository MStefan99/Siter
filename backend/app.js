'use strict';

const path = require('path');
const express = require('express');

const viewsRouter = require('./routes/views');
const authRouter = require('./routes/auth');
const settingsRouter = require('./routes/settings');
const appRouter = require('./routes/apps');
const fileRouter = require('./routes/files');

const appManager = require('./lib/app_manager');

process.on('unhandledRejection', (reason, promise) => {
	console.error('Unhandled Rejection: ', reason);
	process.exit(~0x1);
});


process.on('uncaughtException', (err, origin) => {
	console.error('Uncaught exception: ', err);
	process.exit(~0x0);
});


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

app.use('/auth', authRouter);
app.use('/settings', settingsRouter);
app.use('/apps', appRouter);
app.use('/files', fileRouter);
app.use(viewsRouter);


app.use((err, req, res, next) => {
	console.error(err);
	res.status(500).sendFile(path.join(__dirname, 'views/standalone/internal.html'));
});


require('./lib/init').init().then(() => {
	appManager.start(app);
	console.log('Siter is now running! Open http://siter.localhost/ to get started.');
});
