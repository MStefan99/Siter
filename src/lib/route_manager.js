'use strict';

const http = require('http');
const https = require('https');
const tls = require('tls');
const path = require('path');
const fs = require('fs');

const smartConfig = require('./config');
const mime = require('mime-types');
const compiledViews = path.join(__dirname, '..', '..', 'views', 'compiled');

const routes = [];
const servers = new Map();
const securitySettings = {};
let siter;


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


async function start(defaultHandler) {
	if (siter) {
		throw new Error('Route Manager is already started');
	}
	if (!defaultHandler) {
		throw new Error('Default handler must be defined');
	}
	siter = defaultHandler;
	const config = await smartConfig;
	Object.assign(securitySettings, config.options);

	httpServer.listen(80);
	servers.set(80, httpServer);

	if (securitySettings.httpsEnabled) {
		httpsServer.listen(443);
		servers.set(443, httpsServer);
	}

	for (const route of config.routes) {
		routes.push(route);
		addServer(route);
	}
}


function findRouteByDomain(domain) {
	if (domain.match(/^siter\./)) {
		return {
			secure: securitySettings.httpsEnabled,
			certFile: securitySettings.certFile,
			keyFile: securitySettings.keyFile
		};
	} else {
		return routes.find(route =>
			route.domain? domain.match(route.domain) : true);
	}
}


function findRoute(host, port, url) {
	return routes.find(route =>
		(route.domain? host === route.domain : true) &&
		(route.port === port) &&
		(route.prefix? url.match(route.prefix) : true));
}


function getSecureContext(route) {
	return tls.createSecureContext({
		key: fs.readFileSync(route.keyFile),
		cert: fs.readFileSync(route.certFile)
	});
}


function addServer(route) {
	let server = servers.get(+route.port);

	if (!server) {
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
		servers.set(route.port, server);
	}
}


function updateServer(oldRoute, newRoute) {
	if (oldRoute.port !== newRoute.port) {
		let server = servers.get(oldRoute.port);

		if (!routes.some(r => r.port === oldRoute.port)) {
			server.close();
			server.listen(newRoute.port);

			servers.delete(oldRoute.port);
			servers.set(newRoute.port, server);
		} else {
			addServer(newRoute);
		}
	}
}


function removeServer(route) {
	if (route.port === 80 || (securitySettings.httpsEnabled && route.port === 443)) {
		return;
	}
	let server = servers.get(route.port);

	if (!routes.some(r => r.port === route.port)) {
		server.close();
		servers.delete(route.port);
	}
}


function handleRequest(request, response) {
	const server = this;
	const host = request.headers.host;
	const port = server.address().port;
	const url = request.url;

	if (host.match(/^siter\./)) {
		if (!request.connection.encrypted &&
			securitySettings.httpsEnabled &&
			securitySettings.httpsRedirect) {
			response.writeHead(303, {
				Location: 'https://' + host + url
			}).end();
		} else {
			siter(request, response);
		}
	} else {
		const route = findRoute(host, port, url);

		if (!route) {
			sendFile(response, path.join(compiledViews, 'no_route.html'), 404);
		} else {
			const postfix = url.replace(new RegExp(`^${route.prefix}|\\?.*$`, 'ig'), '');

			if (route.target === 'directory') {  // Serving static files
				const filePath = path.join(route.tDirectory, ...postfix.split('/'));

				// trying requested file
				sendFile(response, filePath, 200, () => {
					// trying requested file with .html extension
					sendFile(response, filePath + '.html', 200, () => {
						// trying to treat as a folder with index.html
						sendFile(response, path.join(filePath, 'index.html'), 200, () => {
							// file not found
							sendFile(response, path.join(compiledViews, 'no_file.html'), 404);
						});
					});
				});
			} else if (route.target === 'server') {  // Proxying requests to other servers
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
					sendFile(response, path.join(compiledViews, 'unavailable.html'), 503);
				});
			}
		}
	}
}


function sendFile(response, filePath, statusCode, errorCallback) {
	fs.stat(filePath, (err, stats) => {
		if (err || stats.isDirectory()) {
			if (errorCallback) {
				errorCallback(err);
			}
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
				})
				.on('err', err => {
					if (errorCallback) {
						errorCallback(err);
					}
				});
		}
	});
}


function getRoutes() {
	return routes ?? {};
}


function sanitizeRoute(route) {
	route.seq = +route.seq > 0? +route.seq : 1;
	route.port = isAValidPort(+route.port)? +route.port : 80;
	route.secure = !!route.secure;
	route.tPort = +route.tPort;

	return route;
}


async function addRoute(route) {
	const config = await smartConfig;
	route = sanitizeRoute(route);

	route.id = Math.random().toString(36);
	config.routes.push(route);
	routes.push(route);
	addServer(route);

	return route;
}


async function updateRoute(routeID, newRoute) {
	if (!routeID) {
		return addRoute(newRoute);
	}
	newRoute = sanitizeRoute(newRoute);

	const config = await smartConfig;
	config.routes.splice(config.routes.findIndex(r => r.id === routeID), 1, newRoute);

	const i = routes.findIndex(route => route.id === routeID);

	if (i !== -1) {
		const oldRoute = routes[i];
		Object.assign(routes[i], newRoute);

		updateServer(oldRoute, newRoute);
	}
	return routes[i];
}


async function removeRoute(routeID) {
	const config = await smartConfig;

	config.routes.splice(config.routes.findIndex(r => r.id === routeID), 1);
	const route = routes.splice(routes.findIndex(route => route.id === routeID), 1)[0];

	if (route) {
		removeServer(route);
	}
}


async function setSecurityOptions(options = {}) {
	const config = await smartConfig;

	Object.assign(config.options, options);
	Object.assign(securitySettings, options);
}


function getSecurityOptions() {
	return securitySettings;
}


module.exports = {
	start: start,

	getRoutes: getRoutes,
	addRoute: addRoute,
	updateRoute: updateRoute,
	removeRoute: removeRoute,

	getSecurityOptions: getSecurityOptions,
	setSecurityOptions: setSecurityOptions
};
