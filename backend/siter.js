'use strict';

const path = require('path');
const express = require('express');

const viewsRouter = require('./routes/views');
const authRouter = require('./routes/auth');
const settingsRouter = require('./routes/settings');
const appRouter = require('./routes/apps');
const fileRouter = require('./routes/files');
const {sendLog, colors, resetConsole} = require('./lib/log');

const appManager = require('./lib/app_manager');

process.on('unhandledRejection', async (reason) => {
	console.error(`${colors[4]}[Siter]${resetConsole}`, 'Unhandled Rejection: ', reason);
	try {
		const analytics = appManager.getAnalyticsOptions();
		analytics.enabled && await sendLog(analytics.url, analytics.telemetryKey, 'Unhandled rejection: ' + reason.stack, 4);
	} catch (e) {
		console.error(`${colors[4]}[Siter]${resetConsole}`, 'Unhandled rejection while exiting:', e);
	}
	appManager.stop();
	process.exit(~0x1);
});


process.on('uncaughtException', async (err) => {
	console.error(`${colors[4]}[Siter]${resetConsole}`, 'Uncaught exception: ', err);
	try {
		const analytics = appManager.getAnalyticsOptions();
		analytics.enabled && await sendLog(analytics.url, analytics.telemetryKey, 'Uncaught exception: ' + err.stack, 4);
	} catch (e) {
		console.error(`${colors[4]}[Siter]${resetConsole}`, 'Uncaught exception while exiting:', e);
	}
	appManager.stop();
	process.exit(~0x0);
});


process.on('exit', () => {
	appManager.stop();
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
	console.error(`${colors[3]}[Siter]${resetConsole}`, err);
	res.status(500).sendFile(path.join(__dirname, 'views/standalone/internal.html'));
});


require('./lib/init')
	.init()
	.then(() => appManager.start(app))
	.then(() => console.log(`${colors[1]}[Siter]${resetConsole}`, 'Siter is now running! Open http://siter.localhost/ to get started.'));
