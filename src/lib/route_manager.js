'use strict';

const http = require('http');
const https = require('https');
const tls = require('tls');
const path = require('path');
const fs = require('fs');

const openDB = require('./db');
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


async function init(defaultHandler) {
	if (siter) {
		throw new Error('Route Manager is already started');
	}
	if (!defaultHandler) {
		throw new Error('Default handler must be defined');
	}
	siter = defaultHandler;
	const db = await openDB();

	const options = await db.all(`select key,
                                       value
                                from options
                                where key in ('httpsEnabled',
                                              'httpsRedirect',
                                              'certFile',
                                              'keyFile')`);
	options.forEach(option => {
		securitySettings[option.key] = option.value;
	});

	httpServer.listen(80);
	servers.set(80, httpServer);

	if (securitySettings.httpsEnabled) {
		httpsServer.listen(443);
		servers.set(443, httpsServer);
	}

	await db.each(`select *
                 from routes
                 order by seq`, (err, route) => {
		if (err) {
			console.log(err);
		} else {
			routes.push(route);
			addServer(route);
		}
	});

	await db.close();
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
	if (route.port === 80 ||
		(securitySettings.httpsEnabled && route.port === 443)) {
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
			const postfix = url.replace(new RegExp(`^${route.prefix}`, 'i'), '');

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
	return routes;
}


async function addRoute(route) {
	route.seq = +route.seq;
	route.port = +route.port;
	route.tPort = +route.tPort;

	const db = await openDB();
	await db.run(`insert into routes(seq,
                                   domain,
                                   port,
                                   prefix,
                                   secure,
                                   keyFile,
                                   certFile,
                                   target,
                                   tDirectory,
                                   tAddr,
                                   tPort,
                                   tLocation)
                values ($seq, $domain, $port, $prefix, $secure,
                        $keyFile, $certFile, $target,
                        $tDirectory, $tAddr, $tPort, $tLocation)`, {
		$seq: route.seq > 0? route.seq : 1,
		$domain: route.domain,
		$port: isAValidPort(route.port)? route.port : 80,
		$prefix: route.prefix,
		$secure: !!route.secure,
		$keyFile: route.keyFile,
		$certFile: route.certFile,
		$target: route.target,
		$tDirectory: route.tDirectory,
		$tAddr: route.tAddr,
		$tPort: route.tPort,
		$tLocation: route.tLocation
	});
	route.id = (await db.get(`select last_insert_rowid() as id`)).id;
	await db.close();

	routes.push(route);
	addServer(route);
	return route;
}


async function updateRoute(routeID, newRoute) {
	if (!routeID) {
		return addRoute(newRoute);
	}
	newRoute.seq = +newRoute.seq;
	newRoute.port = +newRoute.port;
	newRoute.tPort = +newRoute.tPort;

	const db = await openDB();
	await db.run(`update routes
                set seq=$seq,
                    domain=$domain,
                    port=$port,
                    prefix=$prefix,
                    secure=$secure,
                    keyFile=$keyFile,
                    certFile=$certFile,
                    target=$target,
                    tDirectory=$tDirectory,
                    tAddr=$tAddr,
                    tPort=$tPort,
                    tLocation=$tLocation
                where id=$id`, {
		$id: routeID,
		$seq: newRoute.seq > 0? newRoute.seq : 1,
		$domain: newRoute.domain,
		$port: isAValidPort(newRoute.port)? newRoute.port : 80,
		$prefix: newRoute.prefix,
		$secure: !!newRoute.secure,
		$keyFile: newRoute.keyFile,
		$certFile: newRoute.certFile,
		$target: newRoute.target,
		$tDirectory: newRoute.tDirectory,
		$tAddr: newRoute.tAddr,
		$tPort: newRoute.tPort,
		$tLocation: newRoute.tLocation
	});

	const i = routes.findIndex(route => route.id === routeID);

	if (i !== -1) {
		const oldRoute = routes[i];
		Object.assign(routes[i], newRoute);

		updateServer(oldRoute, newRoute);
	}
	return routes[i];
}


async function removeRoute(routeID) {
	const db = await openDB();
	routeID = +routeID;

	await db.run(`delete
                from routes
                where id=$id`, {$id: routeID});
	await db.close();

	const route = routes.splice(routes
		.findIndex(route => route.id === routeID), 1)[0];

	if (route) {
		removeServer(route);
	}
}


async function setSecurityOptions(options = {}) {
	const db = await openDB();

	await db.run(`insert or
                replace
                into options(key, value)
                values ('httpsEnabled', $httpsEnabled),
                       ('httpsRedirect', $httpsRedirect),
                       ('certFile', $certFile),
                       ('keyFile', $keyFile)`, {
		$httpsEnabled: options.httpsEnabled, $httpsRedirect: options.httpsRedirect,
		$certFile: options.certFile, $keyFile: options.keyFile
	});
	await db.close();

	Object.assign(securitySettings, options);
}


function getSecurityOptions() {
	return securitySettings;
}


module.exports = {
	start: init,

	getRoutes: getRoutes,
	addRoute: addRoute,
	updateRoute: updateRoute,
	removeRoute: removeRoute,

	getSecurityOptions: getSecurityOptions,
	setSecurityOptions: setSecurityOptions
};
