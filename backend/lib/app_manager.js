'use strict';

const http = require('http');
const https = require('https');
const tls = require('tls');
const path = require('path');
const fs = require('fs');
const crypto = require('crypto');

const smartConfig = require('./config');
const mime = require('mime-types');
const standaloneViews = path.join(__dirname, '..', 'views', 'standalone');

const servers = new Map();
let siter;
let config;
smartConfig.then(c => config = c);


const httpServer = http.createServer(handleRequest);
const httpsServer = https.createServer({
	SNICallback: (servername, cb) => {
		const app = findAppByDomain(servername);
		if (app.secure) {
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


function start(defaultHandler) {
	if (siter) {  // Siter already started, restarting
		for (const port of servers.keys()) {
			removeServer({port}, true);
		}
	}
	if (!defaultHandler) {
		throw new Error('Default handler must be defined');
	}
	siter = defaultHandler;

	httpServer.listen(config.net.httpPort || 80);
	servers.set(config.net.httpPort || 80, httpServer);

	if (config.net.httpsEnabled) {
		httpsServer.listen(config.net.httpsPort || 443);
		servers.set(config.net.httpsPort || 443, httpsServer);
	}

	for (const app of config.apps) {
		addServer(app);
	}
}


function findAppByDomain(domain) {
	if (domain.match(/^siter\./)) {
		return {
			secure: config.net.httpsEnabled,
			certFile: config.net.certFile,
			keyFile: config.net.keyFile
		};
	} else {
		return config.apps.find(app =>
			app.hosting.source.hostname ? domain.match(app.hosting.source.hostname) : true);
	}
}


function findApp(host, port, url) {
	return config.apps.find(app =>
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
	} catch {
		return {}
	}
}


function addServer(app) {
	if (!servers.get(+app.hosting.source.port)) {
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
}


function updateServer(oldApp, newApp) {
	if (oldapp.hosting.source.port !== newapp.hosting.source.port) {
		removeServer(oldApp);
		addServer(newApp);
	}
}


function removeServer(app, force = false) {
	if (!force) {
		if (app.hosting.source.port === (config.net.httpPort || 80) ||
			(config.net.httpsEnabled && app.hosting.source.port === (config.net.httpsPort || 443))) {
			return;  // Not removing Siter server
		}

		if (!config.apps.some(a => a.route.source.port === app.hosting.source.port)) {
			return;  // Some apps are still using the server, thus not removing
		}
	}

	const server = servers.get(+app.hosting.source.port);
	if (!server) {
		return;
	}

	server.close();
	servers.delete(+app.hosting.source.port);
}


function handleRequest(request, response) {
	const server = this;
	const host = request.headers.host.replace(/:.*/, '');
	const port = server.address().port;
	const url = request.url;

	try {
		if (url.match(/\?.*force-siter=true/)) {
			siter(request, response);
		} else if (host.match(/^siter\./)) {
			if (!request.connection.encrypted &&
				config.net.httpsEnabled &&
				config.net.httpsRedirect) {
				response.writeHead(303, {
					Location: 'https://' + host + url
				}).end();
			} else {
				siter(request, response);
			}
		} else {
			const app = findApp(host, port, url);

			if (!app) {
				sendFile(response, path.join(standaloneViews, 'no_app.html'), 404);
			} else {
				if (app.hosting.target.directory?.length) {  // Serving static files
					const postfix = url.replace(new RegExp(`^${app.hosting.source.pathname}|\\?.*$`, 'ig'), '');
					const filePath = path.join(app.hosting.target.directory, ...postfix.split('/'));

					// trying requested file
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
						headers: request.headers
					};
					options.headers['x-forwarded-for'] = request.connection.remoteAddress;

					const req = http.request(options);

					req.on('upgrade', (res, socket, head) => {
						response.writeHead(res.statusCode, res.statusMessage, res.headers);
						res.pipe(response);
						request.socket.pipe(socket);
						res.socket.pipe(response.socket);
						// TODO: fix connection closing
					});

					req.on('response', res => {
						response.writeHead(res.statusCode, res.statusMessage, res.headers);
						res.pipe(response);
					});

					request.pipe(req).on('error', err => {
						sendFile(response, path.join(standaloneViews, 'unavailable.html'), 503);
					});
				}
			}
		}
	} catch (err) {
		console.error(err);
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
	return config.apps ?? [];
}


function sanitizeApp(app) {
	app.hosting.order = +app.hosting.order > 0 ? +app.hosting.order : 1;
	app.hosting.source.port = isAValidPort(+app.hosting.source.port) ? +app.hosting.source.port : (config.net.httpPort || 80);
	app.hosting.source.secure = !!app.hosting.source.secure;
	app.hosting.target.port = +app.hosting.target.port;

	for (const prop in app) {
		if (app.hasOwnProperty(prop)
			&& (app[prop] === null || app[prop] === undefined)) {
			delete app[prop];
		}
	}

	if (!app.hosting.source.hostname || !isAValidPort(+app.hosting.source.port)) {
		throw new Error('App domain or port is invalid');
	} else if (app.hosting.source.secure && (!app.hosting.source.cert || !app.hosting.source.key)) {
		throw new Error('Secure apps must have a certificate and a key file');
	} else if (!app.hosting.target.directory && (!app.hosting.target.hostname || !isAValidPort(+app.hosting.target.port))) {
		throw new Error('App target set to server but server address is invalid');
	}
	return app;
}


function addApp(app) {
	app = sanitizeApp(app);

	app.id = crypto.randomUUID();
	config.apps.push(app);
	addServer(app);

	return app;
}


function updateApp(appID, newApp) {
	if (!appID) {
		return addApp(newApp);
	}
	newApp = sanitizeApp(newApp);
	newApp.id = appID;

	const oldApp = config.apps.splice(config.apps.findIndex(r => r.id === appID),
		1, newApp)[0];

	if (oldApp) {
		updateServer(oldApp, newApp);
	}
	return newApp;
}


function removeApp(appID) {
	const app = config.apps.splice(config.apps.findIndex(r => r.id === appID), 1)[0];

	if (app) {
		removeServer(app);
	}
}

function reorder(newOrder) {
	const apps = [];

	while (newOrder.length) {
		const id = newOrder.shift();
		const idx = config.apps.findIndex(r => r.id === id);

		apps.push(config.apps[idx]);
		config.apps.splice(idx, 1);
	}

	apps.concat(config.apps);
	config.apps = apps;
}


function setNetOptions(options = {}) {
	Object.assign(config.net, options);
	config.net.httpsEnabled = !!options.httpsEnabled;
	config.net.httpsRedirect = !!options.httpsRedirect;
	start(siter);
}


function getNetOptions() {
	return config.net;
}


module.exports = {
	start,

	getApps,
	addApp,
	updateApp,
	removeApp,
	reorder,

	setNetOptions,
	getNetOptions
};