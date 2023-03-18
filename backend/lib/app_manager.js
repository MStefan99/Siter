'use strict';

const http = require('http');
const https = require('https');
const tls = require('tls');
const path = require('path');
const fs = require('fs');
const process = require('process');
const childProcess = require('child_process');
const crypto = require('crypto');

const db = require('./db');
const {sendLog} = require('./log');
const mime = require('mime-types');
const standaloneViews = path.join(__dirname, '..', 'views', 'standalone');

const clampMax = (val, max) => val > max ? max : val;

const crashThreshold = 1000 * 60 * 10;
const initialDelay = 1000 * 10;
const maxDelay = 1000 * 60 * 5;

const servers = new Map();
const processes = new Map();
let siter = null;
let apps = [];
const net = {};
const analytics = {};


const httpServer = http.createServer(handleRequest);
const httpsServer = https.createServer({
	SNICallback: (servername, cb) => {
		const app = findAppByDomain(servername);
		if (app.hosting.source.secure) {
			cb(null, getSecureContext(app));
		} else {
			cb(new Error('Secure request to a non-secure app could not be handled'), null);
		}
	}
}, handleRequest);


function isAValidPort(port) {
	port = +port;
	return port > 0 && port < 65535;
}


async function start(defaultHandler) {
	if (siter) {  // Siter already started, restarting
		for (const port of servers.keys()) {
			removeServer(null, true, port);
		}
	}
	if (!defaultHandler) {
		throw new Error('Default handler must be defined');
	}
	siter = defaultHandler;

	const netCollection = await db('net');
	const netOptions = await netCollection.find().toArray();
	netOptions.forEach(o => net[o.key] = o.value);

	const analyticsCollection = await db('analytics');
	const analyticsOptions = await analyticsCollection.find().toArray();
	analyticsOptions.forEach(o => analytics[o.key] = o.value);

	const appCollection = await db('apps');
	apps = await appCollection.find().sort({'hosting.order': 1}).toArray();

	httpServer.listen(net.httpPort || 80);
	servers.set(net.httpPort || 80, httpServer);

	if (net.httpsEnabled) {
		httpsServer.listen(net.httpsPort || 443);
		servers.set(net.httpsPort || 443, httpsServer);
	}

	for (const app of apps) {
		addServer(app);
		addProcesses(app);
	}
}

function stop() {
	for (const app of apps) {
		removeProcesses(app);
	}
}

function findAppByDomain(domain) {
	if (domain.match(/^siter\./)) {
		return {
			hosting: {
				source: {
					secure: net.httpsEnabled,
					cert: net.cert,
					key: net.key
				}
			}
		};
	} else {
		return apps.find(app =>
			app.hosting.source.hostname ? domain.match(app.hosting.source.hostname) : true);
	}
}


function findApp(host, port, url) {
	return apps.find(app =>
		(app.hosting.source.hostname ? host === app.hosting.source.hostname : true) &&
		(app.hosting.source.port === port) &&
		(app.hosting.source.pathname ? url.match(app.hosting.source.pathname) : true));
}


function getSecureContext(app) {
	try {
		return tls.createSecureContext({
			// TODO: async
			key: fs.readFileSync(app.hosting.source.key),
			cert: fs.readFileSync(app.hosting.source.cert)
		});
	} catch (err) {
		console.error('Failed to create secure context: ', err);
		return {}
	}
}


function addServer(app) {
	if (!app.hosting.enabled) {
		return; // Hosting disabled
	}

	if (servers.get(+app.hosting.source.port)) {
		return; // Server already exists
	}

	let server;
	if (app.hosting.source.secure) {
		server = https.createServer({
			SNICallback: (servername, cb) => {
				const app = findAppByDomain(servername) || {};
				if (app.hosting.source.secure) {
					cb(null, getSecureContext(app));
				}
			}
		}, handleRequest);
	} else {
		server = http.createServer(handleRequest);
	}

	server.listen(app.hosting.source.port);
	servers.set(+app.hosting.source.port, server);
}


function removeServer(app, force = false, port = null) {
	if (!force) {
		if (app.hosting.source.port === (net.httpPort || 80) ||
			(net.httpsEnabled && app.hosting.source.port === (net.httpsPort || 443))) {
			return;  // Not removing Siter server
		}

		if (!apps.some(a => a.hosting.source.port === app.hosting.source.port)) {
			return;  // Some apps are still using the server, thus not removing
		}
	}

	if (app) {
		port = +app.hosting.source.port;
	}

	const server = servers.get(port);
	if (!server) {
		return;
	}

	server.close();
	servers.delete(port);
}


function updateServer(oldApp, newApp) {
	removeServer(oldApp);
	addServer(newApp);
}

function setEnv(app, pr) {
	pr.env.PATH = process.env.PATH;

	if (app.hosting.enabled) {
		pr.env.PORT = app.hosting.target.port;
	} else {
		delete(pr.env.PORT);
	}

	if (app.analytics.metricsEnabled || app.analytics.loggingEnabled) {
		pr.env.CRASH_COURSE_URL = app.analytics.url;
		pr.env.CRASH_COURSE_KEY = app.analytics.key;
	} else {
		delete(pr.env.CRASH_COURSE_URL);
		delete(pr.env.CRASH_COURSE_KEY);
	}
}

function startProcess(cmd, cwd, env, onstart, restartDelay = 0, restartCount = 0, lastRestart = Date.now()) {
	const child = childProcess.exec(cmd, {cwd, env});
	const restart = () => setTimeout(() => {
		const now = Date.now();

		if (now - lastRestart < crashThreshold && restartCount > 5) {
			restartDelay = restartDelay ? clampMax(restartDelay * 2, maxDelay) : initialDelay;
		} else if (now - lastRestart > crashThreshold) {
			restartDelay = restartCount = 0;
		}

		++restartCount;
		lastRestart = now;

		startProcess(cmd, cwd, env, onstart, restartDelay, restartCount, lastRestart);
	}, restartDelay);

	child.stderr.pipe(process.stderr);
	processes.set(cmd, {process: child, restart});
	child.on('exit', restart);
	onstart && onstart(child);

	return child;
}

function stopProcess(cmd) {
	const {process = null, restart = null} = processes.get(cmd) || {};

	process?.off('exit', restart);
	process?.kill('SIGKILL');
	processes.delete(cmd);
}

function addProcesses(app) {
	if (!app.pm.enabled) {
		return; // Process manager disabled
	}

	for (const pr of app.pm.processes) {
		const cmd = `${pr.cmd} ${pr.flags} ${pr.path}`;
		if (processes.has(cmd)) {
			continue; // Process already launched
		}

		setEnv(app, pr);

		startProcess(cmd, path.dirname(pr.path), pr.env, child => {
			if (app.analytics.loggingEnabled) {
				child.stdout.on('data', data => sendLog(app.analytics.url, app.analytics.key, data, 1));
				child.stderr.on('data', data => sendLog(app.analytics.url, app.analytics.key, data, 3));
				child.on('close', code => child.listenerCount('exit') &&
					sendLog(app.analytics.url, app.analytics.key,
						`Siter: ${cmd} exited with code ` + code, 4));
			}
		});
	}
}

function removeProcesses(app) {
	for (const pr of app.pm.processes) {
		const cmd = `${pr.cmd} ${pr.flags} ${pr.path}`;

		stopProcess(cmd);
	}
}

function updateProcesses(oldApp, newApp) {
	removeProcesses(oldApp);
	addProcesses(newApp);
}


function handleRequest(request, response) {
	try {
		const start = process.hrtime.bigint();
		const server = this;
		const host = request.headers.host.replace(/:.*/, '');
		const port = server.address()?.port;
		const url = request.url;

		if (url.match('force-siter=true')) {
			siter(request, response);
		} else if (host.startsWith('siter')) {
			if (!request.connection.encrypted &&
				net.httpsEnabled &&
				net.httpsRedirect) {
				response.writeHead(303, {
					Location: 'https://' + host + url
				}).end();
			} else {
				siter(request, response);
				// TODO: an example, add logs in other places and make them more useful
				const time = Number(process.hrtime.bigint() - start) / 1000;
				analytics.enabled && sendLog(analytics.url, analytics.key, `Siter route matched in ${time} µs, ${host}${url}`, 0);
			}
		} else {
			const app = findApp(host, port, url);

			if (!app) {
				sendFile(response, path.join(standaloneViews, 'no_app.html'), 404);
			} else {
				if (app.hosting.cors.origins.some(origin => request.headers.origin?.includes(origin))) {
					response.setHeader('Access-Control-Allow-Origin', request.headers.origin);
				}

				if (app.hosting.target.directory?.length) {  // Serving static files
					const postfix = (app.hosting.target.routing || url.match(/\.\w+$/)) ?
						url.replace(new RegExp(`^${app.hosting.source.pathname}|\\?.*$`, 'ig'), '') : '';
					const filePath = path.join(app.hosting.target.directory, ...postfix.split('/'));

					const time = Number(process.hrtime.bigint() - start) / 1000;
					analytics.enabled && sendLog(analytics.url, analytics.key, `Directory route matched in ${time} µs, ${host}${url}`, 0);
					// Trying requested file
					sendFile(response, filePath, 200)
						// trying requested file with .html extension
						.catch(() => sendFile(response, filePath + '.html', 200))
						// trying to treat as a folder with index.html
						.catch(() => sendFile(response, path.join(filePath, 'index.html'), 200))
						// none of the options worked, sending 404
						.catch(() => sendFile(response, path.join(standaloneViews, 'no_file.html'), 404));

				} else {  // Proxying requests to other servers
					const postfix = url.replace(new RegExp(`^${app.hosting.source.pathname}`, 'ig'), '');
					const options = {
						hostname: app.hosting.target.hostname,
						port: app.hosting.target.port,
						path: postfix,
						method: request.method,
						headers: Object.assign(request.headers, {
							'Host': app.hosting.target.hostname
						})
					};
					options.headers['x-forwarded-for'] = request.connection.remoteAddress;
					const req = (app.hosting.target.secure || app.hosting.target.port === 443) ?
						https.request(options) : http.request(options);

					const time = Number(process.hrtime.bigint() - start) / 1000;
					analytics.enabled && sendLog(analytics.url, analytics.key, `Proxy route matched in ${time} µs, ${host}${url}`, 0);

					req.on('upgrade', (res, socket, head) => {
						response.writeHead(res.statusCode, res.statusMessage, res.headers);
						res.pipe(response);
						request.socket.pipe(socket);
						res.socket.pipe(response.socket);
						// TODO: fix connection closing and wss
					});

					req.on('response', res => {
						response.writeHead(res.statusCode, res.statusMessage, res.headers);
						res.pipe(response);
					});

					request.pipe(req).on('error', () => {
						sendFile(response, path.join(standaloneViews, 'unavailable.html'), 503);
					});
				}
			}
		}
	} catch (err) {
		console.error('Failed to handle request:', err);
		analytics.enabled && sendLog(analytics.url, analytics.key, err, 3);
		sendFile(response, path.join(standaloneViews, 'internal.html'), 500);
	}
}


function sendFile(response, filePath, statusCode) {
	return new Promise((resolve, reject) => {
		fs.stat(filePath, (err, stats) => {
			if (err || stats.isDirectory()) {
				reject(err);
			} else {
				const fileStream = fs.createReadStream(filePath);

				response.writeHead(statusCode || 200, {
					'content-type': mime.contentType(path.extname(filePath)) || 'application/octet-stream',
					'content-length': stats.size
				});

				fileStream
					.pipe(response)
					.on('end', () => {
						response.end();
						resolve();
					})
					.on('err', err => {
						reject(err);
					});
			}
		});
	});
}


function getApps() {
	return apps;
}


function sanitizeApp(app) {
	app.hosting.order = +app.hosting.order > 0 ? +app.hosting.order : 1;
	app.hosting.source.port = isAValidPort(+app.hosting.source.port) ? +app.hosting.source.port : (net.httpPort || 80);
	app.hosting.source.secure = !!app.hosting.source.secure;
	app.hosting.target.port = +app.hosting.target.port;

	for (const prop in app) {
		if (app.hasOwnProperty(prop)
			&& (app[prop] === null || app[prop] === undefined)) {
			delete app[prop];
		}
	}

	return app;
}


async function addApp(app) {
	app = sanitizeApp(app);

	app.id = crypto.randomUUID();
	apps.push(app);
	addServer(app);
	addProcesses(app);

	if (app.order) {
		app.order = apps.length;
	}

	const appCollection = await db('apps');
	appCollection.insertOne(app);

	return app;
}


async function updateApp(appID, newApp) {
	if (!appID) {
		return addApp(newApp);
	}
	newApp = sanitizeApp(newApp);
	newApp.id = appID;

	const oldApp = apps.splice(apps.findIndex(r => r.id === appID),
		1, newApp)[0];

	if (oldApp) {
		updateServer(oldApp, newApp);
		updateProcesses(oldApp, newApp);
	}

	delete (newApp._id);
	const appCollection = await db('apps');
	appCollection.replaceOne({id: appID}, newApp);

	return newApp;
}


async function removeApp(appID) {
	const app = apps.splice(apps.findIndex(a => a.id === appID), 1)[0];

	if (app) {
		removeServer(app);
		removeProcesses(app);
	}

	const appCollection = await db('apps');
	appCollection.deleteOne({id: appID});
}

async function reorder(newOrder) {
	for (let i = 0; i < newOrder.length; ++i) {
		const idx = apps.findIndex(a => a.id === newOrder[i]);

		apps[idx].hosting.order = i;
	}

	apps.sort((a1, a2) => a1.hosting.order - a2.hosting.order);

	const appCollection = await db('apps');
	apps.forEach(async a => await appCollection.updateOne({id: a.id}, {$set: {'hosting.order': a.hosting.order}}));
}


async function setNetOptions(options = {}) {
	const sanitized = {};

	isAValidPort(options.httpPort) && (sanitized.httpPort = +options.httpPort);
	isAValidPort(options.httpsPort) && (sanitized.httpsPort = +options.httpsPort);
	sanitized.httpsEnabled = !!options.httpsEnabled;
	sanitized.httpsRedirect = !!options.httpsRedirect;
	sanitized.cert = options.cert.toString();
	sanitized.key = options.key.toString();

	Object.assign(net, sanitized);
	const netCollection = await db('net');
	Object.keys(sanitized).forEach(k => netCollection.updateOne({key: k}, {$set: {value: sanitized[k]}}, {upsert: true}));

	start(siter);
}


function getNetOptions() {
	return net;
}


async function setAnalyticsOptions(options = {}) {
	const sanitized = {};

	sanitized.enabled = !!options.enabled;
	sanitized.url = options.url.toString();
	sanitized.audienceKey = options.audienceKey.toString();
	sanitized.telemetryKey = options.telemetryKey.toString();

	Object.assign(analytics, sanitized);
	const analyticsCollection = await db('analytics');
	Object.keys(sanitized).forEach(k => analyticsCollection.updateOne({key: k}, {$set: {value: sanitized[k]}}, {upsert: true}));
}


function getAnalyticsOptions() {
	return analytics;
}


module.exports = {
	start,
	stop,

	getApps,
	addApp,
	updateApp,
	removeApp,
	reorder,

	setNetOptions,
	getNetOptions,

	setAnalyticsOptions,
	getAnalyticsOptions
};
