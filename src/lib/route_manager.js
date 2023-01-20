'use strict';

const http = require('http');
const https = require('https');
const tls = require('tls');
const path = require('path');
const fs = require('fs');
const crypto = require('crypto');

const smartConfig = require('./config');
const mime = require('mime-types');
const standaloneViews = path.join(__dirname, '..', '..', 'views', 'standalone');

const servers = new Map();
let siter;
let config;
smartConfig.then(c => config = c);


const httpServer = http.createServer(handleRequest);
const httpsServer = https.createServer({
	SNICallback: (servername, cb) => {
		const route = findRouteByDomain(servername) || {};
		if (route.secure) {
			cb(null, getSecureContext(route));
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

	for (const route of config.routes) {
		addServer(route);
	}
}


function findRouteByDomain(domain) {
	if (domain.match(/^siter\./)) {
		return {
			secure: config.net.httpsEnabled,
			certFile: config.net.certFile,
			keyFile: config.net.keyFile
		};
	} else {
		return config.routes.find(route =>
			route.domain ? domain.match(route.domain) : true);
	}
}


function findRoute(host, port, url) {
	return config.routes.find(route =>
		(route.domain ? host === route.domain : true) &&
		(route.port === port) &&
		(route.prefix ? url.match(route.prefix) : true));
}


function getSecureContext(route) {
	try {
		return tls.createSecureContext({
			key: fs.readFileSync(route.keyFile),
			cert: fs.readFileSync(route.certFile)
		});
	} catch {
		return {}
	}
}


function addServer(route) {
	if (!servers.get(+route.port)) {
		let server;

		if (route.secure) {
			server = https.createServer({
				SNICallback: (servername, cb) => {
					const route = findRouteByDomain(servername) || {};
					if (route.secure) {
						cb(null, getSecureContext(route));
					}
				}
			}, handleRequest);
		} else {
			server = http.createServer(handleRequest);
		}

		server.listen(route.port);
		servers.set(+route.port, server);
	}
}


function updateServer(oldRoute, newRoute) {
	if (oldRoute.port !== newRoute.port) {
		removeServer(oldRoute);
		addServer(newRoute);
	}
}


function removeServer(route, force = false) {
	if (!force) {
		if (route.port === (config.net.httpPort || 80) ||
			(config.net.httpsEnabled && route.port === (config.net.httpsPort || 443))) {
			return;  // Not removing Siter server
		}

		if (!config.routes.some(r => r.port === route.port)) {
			return;  // Some routes are still using the server, thus not removing
		}
	}

	const server = servers.get(+route.port);
	if (!server) {
		return;
	}

	server.close();
	servers.delete(+route.port);
}


function handleRequest(request, response) {
	const server = this;
	const host = request.headers.host.replace(/:.*/, '');
	const port = server.address().port;
	const url = request.url;

	try {
		if (host.match(/^siter\./) || url.match(/\?.*force-siter=true/)) {
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
			const route = findRoute(host, port, url);

			if (!route) {
				sendFile(response, path.join(standaloneViews, 'no_route.html'), 404);
			} else {
				if (route.target === 'directory') {  // Serving static files
					const postfix = url.replace(new RegExp(`^${route.prefix}|\\?.*$`, 'ig'), '');
					const filePath = path.join(route.tDirectory, ...postfix.split('/'));

					// trying requested file
					sendFile(response, filePath, 200)
						// trying requested file with .html extension
						.catch(() => sendFile(response, filePath + '.html', 200))
						// trying to treat as a folder with index.html
						.catch(() => sendFile(response, path.join(filePath, 'index.html'), 200))
						// none of the options worked, sending 404
						.catch(() => sendFile(response, path.join(standaloneViews, 'no_file.html'), 404));

				} else if (route.target === 'server') {  // Proxying requests to other servers
					const postfix = url.replace(new RegExp(`^${route.prefix}`, 'ig'), '');
					const options = {
						hostname: route.tAddr,
						port: route.tPort,
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


function getRoutes() {
	return config.routes ?? {};
}


function sanitizeRoute(route) {
	route.seq = +route.seq > 0 ? +route.seq : 1;
	route.port = isAValidPort(+route.port) ? +route.port : (config.net.httpPort || 80);
	route.secure = !!route.secure;
	route.tPort = +route.tPort;

	for (const prop in route) {
		if (route.hasOwnProperty(prop)
			&& (route[prop] === null || route[prop] === undefined)) {
			delete route[prop];
		}
	}

	if (!route.domain || !isAValidPort(+route.port)) {
		throw new Error('Route domain or port is invalid');
	} else if (route.secure && (!route.certFile || !route.keyFile)) {
		throw new Error('Secure routes must have a certificate and a key file');
	} else if (route.target === 'directory' && !route.tDirectory) {
		throw new Error('Route target set to directory but no directory was specified');
	} else if (route.target === 'server' && (!route.tAddr || !isAValidPort(+route.port))) {
		throw new Error('Route target set to server but server address is invalid');
	}
	return route;
}


function addRoute(route) {
	route = sanitizeRoute(route);

	route.id = crypto.randomUUID();
	config.routes.push(route);
	addServer(route);

	return route;
}


function updateRoute(routeID, newRoute) {
	if (!routeID) {
		return addRoute(newRoute);
	}
	newRoute = sanitizeRoute(newRoute);
	newRoute.id = routeID;

	const oldRoute = config.routes.splice(config.routes.findIndex(r => r.id === routeID),
		1, newRoute)[0];

	if (oldRoute) {
		updateServer(oldRoute, newRoute);
	}
	return newRoute;
}


function removeRoute(routeID) {
	const route = config.routes.splice(config.routes.findIndex(r => r.id === routeID), 1)[0];

	if (route) {
		removeServer(route);
	}
}

function reorder(newOrder) {
	const routes = [];

	while (newOrder.length) {
		const id = newOrder.shift();
		const idx = config.routes.findIndex(r => r.id === id);

		routes.push(config.routes[idx]);
		config.routes.splice(idx, 1);
	}

	routes.concat(config.routes);
	config.routes = routes;
}


function setNetOptions(options = {}) {
	Object.assign(config.net, options);
	start(siter);
}


function getNetOptions() {
	return config.net;
}


module.exports = {
	start,

	getRoutes,
	addRoute,
	updateRoute,
	removeRoute,
	reorder,

	setNetOptions,
	getNetOptions
};
