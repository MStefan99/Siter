const express = require('express');
const router = express.Router();
const {redirectIfNotAuthorized} = require('./auth');
const {getPorts} = require('./ports');


router.use(redirectIfNotAuthorized);


router.get('/get_settings', async (req, res) => {
	// setTimeout(() => res.end(), 1000);
	// return;  // For testing invalid response handling

	const status = {};
	status.ports = await getPorts();
	status.status = 'OK';
	status.directories = [
		{
			id: 0, path: '/', allowOverride: false, active: true, rules: [
				{
					id: 0, type: 'all', allow: false, active: true
				},
				{
					id: 1, type: 'user', allow: true, active: true, users: [
						'user1', 'user2', 'user3'
					]
				},
				{
					id: 2, type: 'ip', active: true, allow: true, ips: [
						'localhost', '127.0.0.1', 'something.com'
					]
				}
			]
		},
		{
			id: 1, path: '/var/www', allowOverride: true, active: true, rules: [
				{id: 0, type: 'all', allow: true}
			]
		},
	];
	status.vhosts = [
		{id: 0, host: 'host1.example.com', ip: '*', port: 80, documentRoot: '/var/www/site1', active: true},
		{id: 1, host: 'host2.example.com', ip: '*', port: 80, documentRoot: '/var/www/site2', active: false},
		{id: 2, host: null, ip: '192.168.1.2', port: 80, documentRoot: '/var/www/site3', active: true},
	];
	status.includes = [
		{id: 0, path: 'ports.conf', optional: false},
		{id: 1, path: 'mods-enabled/*.load', optional: true},
		{id: 2, path: 'mods-enabled/*.conf', optional: true},
		{id: 3, path: 'conf-enabled/*.conf', optional: true},
		{id: 4, path: 'sites-enabled/*.conf', optional: true}
	];
	status.log = {
		errorLog: '${APACHE_LOG_DIR}/error.log',
		logFormats: [
			{id: 0, format: '%h %l %u %t "%r" %>s %O', nickname: 'common'},
			{id: 1, format: '%{User-agent}i', nickname: 'agent'}
		]
	};
	status.timeout = 300;
	status.keepAlive = true;
	status.maxKeepAliveRequests = 100;
	status.keepAliveTimeout = 5;
	status.serverSignature = 'Off';
	status.serverTokens = 'Prod';

	res.send(JSON.stringify(status));
});


module.exports = {workerRouter: router};
