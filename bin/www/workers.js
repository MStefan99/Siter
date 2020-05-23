const express = require('express');
const router = express.Router();
const cookieParser = require('cookie-parser');


router.use(cookieParser());


router.get('/get_settings', (req, res) => {
	res.send(JSON.stringify({  // TODO: replace with something useful
		status: 'OK',
		ports: [
			{port: 80, module: null, on: true},
			{port: 443, module: 'ssl_module', on: true}
		],
		directories: [
			{
				path: '/', allowOverride: false, on: true, rules: [
					{
						type: 'all', allow: false, on: true
					},
					{
						type: 'user', allow: true, on: true, users: [
							'user1', 'user2', 'user3'
						]
					},
					{
						type: 'ip', on: true, allow: true, ips: [
							'localhost', '127.0.0.1', 'something.com'
						]
					}
				]
			},
			{
				path: '/var/www', allowOverride: true, on: true, rules: [
					{type: 'all', allow: true}
				]
			},
		],
		vhosts: [
			{host: 'host1.example.com', ip: '*', port: 80, documentRoot: '/var/www/site1', on: true},
			{host: 'host2.example.com', ip: '*', port: 80, documentRoot: '/var/www/site2', on: false},
			{host: null, ip: '192.168.1.2', port: 80, documentRoot: '/var/www/site3', on: true},
		],
		includes: [
			{path: 'ports.conf', optional: false},
			{path: 'mods-enabled/*.load', optional: true},
			{path: 'mods-enabled/*.conf', optional: true},
			{path: 'conf-enabled/*.conf', optional: true},
			{path: 'sites-enabled/*.conf', optional: true}
		],
		log: {
			errorLog: '${APACHE_LOG_DIR}/error.log',
			logFormats: [
				{format: '%h %l %u %t "%r" %>s %O', nickname: 'common'},
				{format: '%{User-agent}i', nickname: 'agent'}
			]
		},
		timeout: 300,
		keepAlive: true,
		maxKeepAliveRequests: 100,
		keepAliveTimeout: 5,
		serverSignature: 'Off',
		serverTokens: 'Prod',
	}));
});


module.exports = {workerRouter: router};
