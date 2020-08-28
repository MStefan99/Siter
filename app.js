'use strict';

const http = require('http');
const https = require('https');
const path = require('path');
const fs = require('fs');

const openDB = require('./src/lib/db');
const siter = require('./siter');

const routes = [];
const servers = new Map();


(async () => {
	const db = await openDB();

	if (process.env.NO_HTTPS) {
		const defaultServer = http.createServer(handleRequest);
		defaultServer.listen(80);
		servers.set(80, defaultServer);
	}

	await db.each(`select *
                 from routes`, (err, row) => {
		if (err) {
			console.log(err);
		} else {
			routes.push(row);

			let server = servers.get(row.port);
			if (!server) {
				if (row.secure) {
					server = https.createServer(handleRequest);
				} else {
					server = http.createServer(handleRequest);
				}
				server.listen(row.port);
				servers.set(row.port, server);
			}
		}
	});
	await db.close();
})();


function handleRequest(request, response) {
	const server = this;
	const host = request.headers.host;

	if (host.match('siter')) {
		siter(request, response);
	} else {
		const port = server.address().port;
		const url = request.url;

		const route = routes.find(route => route.port === port &&
			(!route.subdomain || host.match(route.subdomain)) &&
			(!route.prefix || url.match(route.prefix)));

		if (!route) {
			response.writeHead(400);
			response.end('Error 400. The requested route not found on the server.');
		} else {
			const postfix = url.replace(new RegExp(`^${route.prefix}`, 'i'), '');

			if (route.directory) {  // Serving static files
				const filePath = path.join(route.directory, ...postfix.split('/'));
				console.log('serving file ' + filePath);

				fs.stat(filePath, (err, stats) => {
					if (err || stats.isDirectory()) {
						response.writeHead(404);
						response.end('Error 404. The requested file cannot be found on the server.');
					} else {
						const fileStream = fs.createReadStream(filePath);

						response.writeHead(200, {
							'Content-Type': 'text/plain',
							'Content-Length': stats.size
						});
						fileStream.pipe(response);
					}
				});
			} else {  // Reverse proxying requests to other servers
				console.log('proxying request to ' + route.targetIP + ':' + route.targetPort + postfix);

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

				request.pipe(req);
			}
		}
	}
}
