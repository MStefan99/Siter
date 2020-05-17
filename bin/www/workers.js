const express = require('express');
const router = express.Router();
const cookieParser = require('cookie-parser');

router.use(cookieParser());


router.post('/dashboard_info', (req, res) => {
	res.send(JSON.stringify({  // TODO: replace with something useful
		status: 'ok',
		ports: [
			{port: 80, ifModule: null, on: true},
			{port: 443, ifModule: 'ssl_module', on: true}
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
			{host: 'host2.example.com', ip: '*', port: 80, documentRoot: '/var/www/site1', on: false},
			{host: null, ip: '192.168.1.2', port: 80, documentRoot: '/var/www/site1', on: true},
		],
		serverSignature: 'Off',
		serverTokens: 'Prod'
	}));
})


module.exports = router
