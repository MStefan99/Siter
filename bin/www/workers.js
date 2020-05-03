const express = require('express');
const router = express.Router();
const cookieParser = require('cookie-parser');

router.use(cookieParser());


router.post('/dashboard_info', (req, res) => {
	res.send(JSON.stringify({  // TODO: replace with something useful
		status: 'ok',
		port: 80,
		directories: [
			{
				path: '/', allowOverride: false, rules: [
					{type: 'all', allow: false},
					{
						type: 'user', allow: true, users: [
							'user1', 'user2', 'user3'
						]
					},
					{
						type: 'ip', allow: true, ips: [
							'localhost', '127.0.0.1', 'something.com'
						]
					}
				]
			},
			{
				path: '/var/www', allowOverride: true, rules: [
					{type: 'all', allow: true}
				]
			},
		],
		vhosts: [
			{host: 'host1', loc: 'path1', on: true},
			{host: 'host2', loc: 'path2', on: true},
			{host: 'host3', loc: 'path3', on: false},
		]
	}));
})


module.exports = router
