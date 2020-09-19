'use strict';

const http = require('http');
const https = require('https');
const tls = require('tls');
const path = require('path');
const fs = require('fs');
const util = require('util');

const openDB = require('./db');
const mimeMap = require('./mime_map');

const readFile = util.promisify(fs.readFile);

const routes = [];
const servers = new Map();
let siter;


function isAValidPort(port) {
	return Number.isInteger(port) && port > 0 && port < 65535;
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

	if (process.env.NO_HTTPS) {
		const defaultServer = http.createServer(handleRequest);
		defaultServer.listen(80);
		servers.set(80, defaultServer);
	}

	await db.each(`select *
                 from routes
                 order by seq`, (err, row) => {
		if (err) {
			console.log(err);
		} else {
			routes.push(row);
			addServer(row);
		}
	});
	await db.close();
}


function findRouteByDomain(domain) {
	return routes.find(route =>
		route.subdomain? domain.match(route.subdomain): true);
}


function findRoute(host, port, url) {
	return routes.find(route =>
		(route.subdomain? host.match(route.subdomain) : true) &&
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
	let server = servers.get(route.port);

	if (!server) {
		if (route.secure) {
			server = https.createServer({
				SNICallback: (servername, cb) => {
					const route = findRouteByDomain(servername);
					if (route.secure) {
						cb(null, getSecureContext(route));
					}
				},
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
	let server = servers.get(route.port);

	if (!routes.some(r => r.port === route.port)) {
		server.close();
		servers.delete(route.port);
	}
}


function handleRequest(request, response) {
	const server = this;
	const host = request.headers.host;

	if (host.match('siter')) {
		siter(request, response);
	} else {
		const port = server.address().port;
		const url = request.url;

		const route = findRoute(host, port, url);

		if (!route) {
			response.writeHead(400);
			sendFile(response, 'no_route.html');
		} else {
			if (route.secure) {
				server.setSecureContext({
					key: fs.readFileSync(route.keyFile),
					cert: fs.readFileSync(route.certFile)
				});
			}

			const postfix = url.replace(new RegExp(`^${route.prefix}`, 'i'), '');

			if (route.directory) {  // Serving static files
				const filePath = path.join(route.directory, ...postfix.split('/'));

				fs.stat(filePath, (err, stats) => {
					if (err || stats.isDirectory()) {
						response.writeHead(404);
						sendFile(response, 'no_file.html');
					} else {
						const fileStream = fs.createReadStream(filePath);
						const mime = mimeMap.get(postfix.replace(/^.*\./, '.'))
							|| 'application/octet-stream';

						response.writeHead(200, {
							'Content-Type': mime,
							'Content-Length': stats.size
						});
						fileStream.pipe(response).on('error', (err) => {
							response.writeHead(500);
							sendFile(response, 'internal.html');
						});
					}
				});
			} else {  // Proxying requests to other servers
				// TODO: fix websocket connections
				const options = {
					hostname: route.targetIP,
					port: route.targetPort,
					path: postfix,
					method: request.method,
					headers: request.headers
				};

				const req = http.request(options, (res) => {
					response.writeHead(res.statusCode, res.statusMessage, res.headers);
					res.pipe(response);
				});

				request.pipe(req).on('error', (err) => {
					response.writeHead(503);
					sendFile(response, 'unavailable.html');
				});
			}
		}
	}
}


async function sendFile(response, fileName) {
	const filePath = path.join(__dirname, '..', '..', 'views', 'compiled', fileName);
	response.end(await readFile(filePath, 'utf-8'));
}


function getRoutes() {
	return routes;
}


async function addRoute(route) {
	route.seq = Number.parseInt(route.seq);
	route.port = Number.parseInt(route.port);
	route.targetPort = Number.parseInt(route.targetPort);

	const db = await openDB();
	await db.run(`insert into routes(seq,
                                   subdomain,
                                   port,
                                   prefix,
                                   secure,
                                   keyFile,
                                   certFile,
                                   directory,
                                   targetIP,
                                   targetPort)
                values ($seq, $subdomain, $port, $prefix, $secure,
                        $keyFile, $certFile, $directory, $targetIP, $targetPort)`, {
		$seq: isAValidPort(route.seq)? route.seq : 1,
		$subdomain: route.subdomain,
		$port: isAValidPort(route.port)? route.port : 80,
		$prefix: route.prefix,
		$secure: !!route.secure,
		$keyFile: route.keyFile,
		$certFile: route.certFile,
		$directory: route.directory,
		$targetIP: route.targetIP,
		$targetPort: route.targetPort
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

	newRoute.seq = Number.parseInt(newRoute.seq);
	newRoute.port = Number.parseInt(newRoute.port);
	newRoute.targetPort = Number.parseInt(newRoute.targetPort);

	const db = await openDB();
	await db.run(`update routes
                set seq=$seq,
                    subdomain=$subdomain,
                    port=$port,
                    prefix=$prefix,
                    secure=$secure,
                    keyFile=$keyFile,
                    certFile=$certFile,
                    directory=$directory,
                    targetIP=$targetIP,
                    targetPort=$targetPort
                where id=$id`, {
		$id: routeID,
		$seq: isAValidPort(newRoute.seq)? newRoute.seq : 1,
		$subdomain: newRoute.subdomain,
		$port: isAValidPort(newRoute.port)? newRoute.port : 80,
		$prefix: newRoute.prefix,
		$secure: newRoute.secure || 0,
		$keyFile: newRoute.keyFile,
		$certFile: newRoute.certFile,
		$directory: newRoute.directory,
		$targetIP: newRoute.targetIP,
		$targetPort: newRoute.targetPort,
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


module.exports = {
	start: init,
	getRoutes: getRoutes,
	addRoute: addRoute,
	updateRoute: updateRoute,
	removeRoute: removeRoute
};
