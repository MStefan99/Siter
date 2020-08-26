const express = require('express');
const router = express.Router();
const {redirectIfNotAuthorized} = require('../../auth');
const {getPorts} = require('../../ports');
const {getDirectories} = require('../../directories');


router.use(redirectIfNotAuthorized);


router.get('/get_settings', async (req, res) => {
	// setTimeout(() => res.end(), 1000);
	// return;  // For testing invalid response handling

	const status = {
		status: 'OK',
		ports: await getPorts(),
		directories: await getDirectories(),
		vhosts: [
			{
				id: 0,
				host: 'host1.example.com',
				ip: '*',
				port: 80,
				documentRoot: '/var/www/site1',
				active: true,
				proxies: [
					{id: 0, host: 'backend1.example.com', path: '/'}
				]
			},
			{
				id: 1,
				host: 'host2.example.com',
				ip: '*',
				port: 80,
				documentRoot: '/var/www/site2',
				active: false,
				proxies: [
					{id: 0, host: 'backend2.example.com', path: '/'}
				]
			},
			{
				id: 2,
				host: null,
				ip: '192.168.1.2',
				port: 80,
				documentRoot: '/var/www/site3',
				active: true
			}
		],
		log: {
			errorLog: '${APACHE_LOG_DIR}/error.log',
			logFormats: [
				{id: 0, format: '%h %l %u %t "%r" %>s %O', nickname: 'common'},
				{id: 1, format: '%{User-agent}i', nickname: 'agent'}
			]
		},
		timeout: 300,
		keepAlive: true,
		maxKeepAliveRequests: 100,
		keepAliveTimeout: 5,
		serverSignature: 'Off',
		serverTokens: 'Prod'
	};

	res.send(JSON.stringify(status));
});


module.exports = {workerRouter: router};
