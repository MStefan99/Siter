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
const {sendLog, colors, resetConsole} = require('./log');
const mime = require('mime-types');
const standaloneViews = path.join(__dirname, '..', 'views', 'standalone');

const clampMax = (val, max) => val > max ? max : val;

const crashThreshold = 1000 * 60 * 10;
const initialDelay = 1000 * 10;
const maxDelay = 1000 * 60 * 5;

const siterHostname = process.env.SITER_HOST || 'siter';
const servers = new Map();
const processes = new Map();
let siter = null;
let apps = [];
const keys = {};
const siterKeys = {};
const net = {};
const analytics = {};

const SNICallback = (hostname, cb) => {
	if (hostname.match(/^siter\./)) {
		cb(null, tls.createSecureContext({
			cert: siterKeys.cert,
			key: siterKeys.key
		}));
	} else {
		const app = apps.find(app => hostname.match(app.hosting.source.hostname) && app.hosting.source.secure);
		if (!app) {
			cb(new Error('Secure request to a non-existing app could not be handled'), null);
		} else if (!app.hosting.source.secure) {
			cb(new Error('Secure request to a non-secure app could not be handled'), null);
		} else {
			cb(null, tls.createSecureContext({
				cert: keys[app.id].cert,
				key: keys[app.id].key
			}));
		}
	}
};

const httpServer = http.createServer(handleRequest);
const httpsServer = https.createServer({SNICallback}, handleRequest);


function isAValidPort(port) {
	port = +port;
	return port > 0 && port < 65535;
}


async function start(defaultHandler) {
	if (siter) {  // Siter already started, restarting
		for (const port of servers.keys()) {
			removeServer(port, true);
		}
	}
	if (!defaultHandler) {
		throw new Error('Default handler must be defined');
	}
	siter = defaultHandler;

	const netCollection = await db('net');
	const netOptions = await netCollection.find().toArray();
	netOptions.forEach(o => net[o.key] = o.value);
	net.httpPort = net.httpPort || 80;
	net.httpsPort = net.httpsPort || 443;

	const analyticsCollection = await db('analytics');
	const analyticsOptions = await analyticsCollection.find().toArray();
	analyticsOptions.forEach(o => analytics[o.key] = o.value);

	const appCollection = await db('apps');
	apps = await appCollection.find().sort({'hosting.order': 1}).toArray();

	httpServer.listen(net.httpPort || 80);
	servers.set(net.httpPort || 80, httpServer);

	if (net.httpsEnabled) {
		await setSiterKeys(net);
		httpsServer.listen(net.httpsPort || 443);
		servers.set(net.httpsPort || 443, httpsServer);
	}

	for (const app of apps) {
		await setKeys(app);
		addAppServers(app);
		addProcesses(app);
	}
}


function stop() {
	for (const app of apps) {
		removeProcesses(app);
	}
}


function findApp(host, port, url) {
	return apps.find(app =>
		(app.hosting.source.hostname ? host === app.hosting.source.hostname : true) &&
		(app.hosting.source.port === port || app.hosting.source.redirectPort) &&
		(app.hosting.source.pathname ? url.match(app.hosting.source.pathname) : true));
}


async function setSiterKeys(net) {
	siterKeys.cert = await fs.promises.readFile(net.cert, 'utf-8');
	siterKeys.key = await fs.promises.readFile(net.key, 'utf-8');
}

async function setKeys(app) {
	if (app.hosting.source.secure) {
		keys[app.id] = {
			cert: await fs.promises.readFile(app.hosting.source.cert, 'utf-8'),
			key: await fs.promises.readFile(app.hosting.source.key, 'utf-8')
		};
	}
}


function addServer(port, secure) {
	if (servers.get(port)) {
		return; // Server already exists
	}

	const server = secure ?
		https.createServer({SNICallback}, handleRequest) :
		http.createServer(handleRequest);

	server.listen(port);
	servers.set(port, server);
}


function removeServer(port, force) {
	if (!force) {
		if (port === (net.httpPort) ||
			(net.httpsEnabled && port === (net.httpsPort))) {
			return;  // Not removing Siter server
		}

		if (apps.some(a => (a.hosting.source.port === port || a.hosting.source.redirectPort === port))) {
			return;  // Some apps are still using the server, thus not removing
		}
	}

	const server = servers.get(port);
	if (!server) {
		return;
	}

	server.close();
	servers.delete(port);
}


function addAppServers(app) {
	if (!app.hosting.enabled) {
		return; // Hosting disabled
	}

	if (app.hosting.source.secure) {
		addServer(app.hosting.source.port, true);
	} else {
		addServer(app.hosting.source.port, false);
	}

	if (app.hosting.source.redirectPort && !servers.has(+app.hosting.source.redirectPort)) {
		addServer(app.hosting.source.redirectPort, false);
	}
}


function removeAppServers(app, force = false) {
	removeServer(+app.hosting.source.port, force);
	removeServer(+app.hosting.source.redirectPort, force);
}


function updateAppServers(oldApp, newApp) {
	removeAppServers(oldApp);
	addAppServers(newApp);
}

function setEnv(app, pr) {
	pr.env.PATH = process.env.PATH;

	if (app.hosting.target.port) {
		pr.env.PORT = app.hosting.target.port;
	} else {
		delete (pr.env.PORT);
	}

	pr.env.CRASH_COURSE_AUDIENCE_KEY = app.analytics.audienceKey;
	if (app.analytics.metricsEnabled || app.analytics.loggingEnabled) {
		pr.env.CRASH_COURSE_URL = app.analytics.url;
		pr.env.CRASH_COURSE_TELEMETRY_KEY = app.analytics.telemetryKey;
	} else {
		delete (pr.env.CRASH_COURSE_URL);
		delete (pr.env.CRASH_COURSE_TELEMETRY_KEY);
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
				child.stdout.on('data', data => sendLog(app.analytics.url, app.analytics.telemetryKey, data, 1));
				child.stderr.on('data', data => sendLog(app.analytics.url, app.analytics.telemetryKey, data, 3));
				child.on('close', code => child.listenerCount('exit') &&
					sendLog(app.analytics.url, app.analytics.telemetryKey,
						`Siter: ${app.name}(${cmd}) exited with code ` + code, 4));
			} else {
				child.stdout.on('data', data => console.log(`${colors[1]}[${app.name}]${resetConsole} ${data.trim()}`));
				child.stderr.on('data', data => console.log(`${colors[3]}[${app.name}]${resetConsole} ${data.trim()}`));
				child.on('close', code => child.listenerCount('exit') &&
					console.error(`${colors[4]}[${app.name}]${resetConsole} "${cmd}" exited with code`, code));
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
		} else if (host.startsWith(siterHostname) && (port === net.httpsPort || port === net.httpPort)) {
			if (!request.connection.encrypted &&
				net.httpsEnabled &&
				net.httpsRedirect) {
				response.writeHead(303, {
					Location: 'https://' + host + ':' + net.httpsPort + url
				}).end();
			} else {
				siter(request, response);
				const time = Number(process.hrtime.bigint() - start) / 1000;
				analytics.enabled && sendLog(analytics.url, analytics.telemetryKey, `Siter route matched in ${time} µs: ${host}${url}`, 0);
			}
		} else {
			const app = findApp(host, port, url);

			if (!app) {
				sendFile(response, path.join(standaloneViews, 'no_app.html'), 404);
			} else {
				if (!request.connection.encrypted &&
					app.hosting.source.redirectPort
				) {
					response.writeHead(303, {
						Location: 'https://' + host + ':' + app.hosting.source.port + url
					}).end();
					return;
				}

				if (app.hosting.cors.origins.some(origin => request.headers.origin?.includes(origin))) {
					response.setHeader('Access-Control-Allow-Origin', request.headers.origin);
				}

				if (app.hosting.target.directory?.length) {  // Serving static files
					const pathname = (app.hosting.target.routing || url.match(/^\/[^?#]+\./)) ?
						url.replace(new RegExp(`^/?${app.hosting.source.pathname}|\\?.*$`, 'ig'), '') : '';
					const filePath = path.join(app.hosting.target.directory, ...pathname.split('/'));

					// Trying requested file
					sendFile(response, filePath, 200)
						// trying requested file with .html extension
						.catch(() => sendFile(response, filePath + '.html', 200))
						// trying to treat as a folder with index.html
						.catch(() => sendFile(response, path.join(filePath, 'index.html'), 200))
						// none of the options worked, sending 404
						.catch(() => sendFile(response, path.join(standaloneViews, 'no_file.html'), 404));

					const time = Number(process.hrtime.bigint() - start) / 1000;
					analytics.enabled && sendLog(analytics.url, analytics.telemetryKey, `Directory route matched in ${time} µs: ${host}${url}`, 0);
				} else {  // Proxying requests to other servers
					const pathname = url.replace(new RegExp(`^/?${app.hosting.source.pathname}/?`, 'ig'), '/');
					const options = {
						hostname: app.hosting.target.hostname,
						port: app.hosting.target.port,
						path: pathname,
						method: request.method,
						headers: Object.assign(request.headers, {
							'Host': app.hosting.target.hostname
						})
					};
					options.headers['x-forwarded-for'] = request.connection.remoteAddress;
					const req = (app.hosting.target.secure || app.hosting.target.port === 443) ?
						https.request(options) : http.request(options);

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

					const time = Number(process.hrtime.bigint() - start) / 1000;
					if (analytics.enabled && !analytics.url.match(app.hosting.source.hostname)) {
						sendLog(analytics.url, analytics.telemetryKey, `Proxy route  matched in ${time} µs: ${host}${url}`, 0);
					}
				}
			}
		}
	} catch (err) {
		analytics.enabled && sendLog(analytics.url, analytics.telemetryKey, `Failed to handle request: ${err.stack}`, 3);
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

	if (app.hosting.source.secure && app.hosting.source.port === 80) {
		app.hosting.source.port = 443;
	} else if (!app.hosting.source.secure && app.hosting.source.port === 443) {
		app.hosting.source.port = 80;
	}

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
	addAppServers(app);
	addProcesses(app);

	if (app.order) {
		app.order = apps.length;
	}

	setKeys(app);
	const appCollection = await db('apps');
	appCollection.insertOne(app);

	return app;
}


async function reorderApps(newOrder) {
	for (let i = 0; i < newOrder.length; ++i) {
		const idx = apps.findIndex(a => a.id === newOrder[i]);

		apps[idx].hosting.order = i;
	}

	apps.sort((a1, a2) => a1.hosting.order - a2.hosting.order);

	const appCollection = await db('apps');
	apps.forEach(async a => await appCollection.updateOne({id: a.id}, {$set: {'hosting.order': a.hosting.order}}));
}


async function restartApp(appID) {
	const app = apps.find(a => appID === a.id);

	removeProcesses(app);
	addProcesses(app);
}


async function updateApp(appID, newApp) {
	if (!appID) {
		return addApp(newApp);
	}
	newApp = sanitizeApp(newApp);
	newApp.id = appID;

	const oldApp = apps.splice(apps.findIndex(r => r.id === appID),
		1, newApp)[0];

	setKeys(newApp);
	if (oldApp) {
		updateAppServers(oldApp, newApp);
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
		removeAppServers(app);
		removeProcesses(app);
	}

	delete (keys[app.id]);
	const appCollection = await db('apps');
	appCollection.deleteOne({id: appID});
}


async function setNetOptions(options = {}) {
	const sanitized = {};

	isAValidPort(options.httpPort) && (sanitized.httpPort = +options.httpPort || 80);
	isAValidPort(options.httpsPort) && (sanitized.httpsPort = +options.httpsPort || 443);
	sanitized.httpsEnabled = !!options.httpsEnabled;
	sanitized.httpsRedirect = !!options.httpsRedirect;
	sanitized.cert = options.cert.toString();
	sanitized.key = options.key.toString();

	await setSiterKeys(sanitized);
	Object.assign(net, sanitized);
	const netCollection = await db('net');
	Object.keys(sanitized).forEach(k => netCollection.updateOne({key: k}, {$set: {value: sanitized[k]}}, {upsert: true}));

	await start(siter);
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
	reorderApps,
	restartApp,
	updateApp,
	removeApp,

	setNetOptions,
	getNetOptions,

	setAnalyticsOptions,
	getAnalyticsOptions
};
