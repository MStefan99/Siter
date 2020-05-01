const express = require('express');
const router = express.Router();
const cookieParser = require('cookie-parser');

router.use(cookieParser());


router.post('/dashboard_info', (req, res) => {
	res.send(JSON.stringify({
		status: 'ok',
		vhosts: [
			{host: 'host1', loc: 'path1', on: true},
			{host: 'host2', loc: 'path2', on: true},
			{host: 'host3', loc: 'path3', on: false},
		]
	}));
})


module.exports = router
