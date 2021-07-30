'use strict';

const http = require('http');
const https = require('https');
const tls = require('tls');
const path = require('path');
const fs = require('fs');

const smartConfig = require('./config');
const mime = require('mime-types');
const compiledViews = path.join(__dirname, '..', '..', 'views', 'standalone');

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
	if (siter) {
		throw new Error('Route Manager is already started');
	}
	if (!defaultHandler) {
		throw new Error('Default handler must be defined');
	}
	siter = defaultHandler;

	httpServer.listen(80);
	servers.set(80, httpServer);

	if (config.options.httpsEnabled) {
		httpsServer.listen(443);
		servers.set(443, httpsServer);
	}

	for (const route of config.routes) {
		addServer(route);
	}
}


function findRouteByDomain(domain) {
	if (domain.match(/^siter\./)) {
		return {
			secure: config.options.httpsEnabled,
			certFile: config.options.certFile,
			keyFile: config.options.keyFile
		};
	} else {
		return config.routes.find(route =>
			route.domain? domain.match(route.domain) : true);
	}
}


function findRoute(host, port, url) {
	return config.routes.find(route =>
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

		if (!config.routes.some(r => r.port === oldRoute.port) && server) {
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
	if (route.port === 80 || (config.options.httpsEnabled && route.port === 443)) {
		return;
	}
	let server = servers.get(route.port);

	if (!config.routes.some(r => r.port === route.port) && server) {
		server.close();
		servers.delete(route.port);
	}
}


function handleRequest(request, response) {
	const server = this;
	const host = request.headers.host;
	const port = server.address().port;
	const url = request.url;

	if (host.match(/^siter\./) || url.match(/\?.*force-siter=true/)) {
		if (!request.connection.encrypted &&
			config.options.httpsEnabled &&
			config.options.httpsRedirect) {
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
	return config.routes ?? {};
}


function sanitizeRoute(route) {
	route.seq = +route.seq > 0? +route.seq : 1;
	route.port = isAValidPort(+route.port)? +route.port : 80;
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

	route.id = Math.random().toString(36).substr(2);
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


function setSecurityOptions(options = {}) {
	config.options = options;
}


function getSecurityOptions() {
	return config.options;
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
