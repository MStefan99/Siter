const express = require('express');
const router = express.Router();
const openDB = require('../db');
const {redirectIfNotAuthorized} = require('./auth');


router.use(redirectIfNotAuthorized);
router.use(express.json());


async function getPorts() {
	const db = await openDB();
	return db.all(`select *
                   from ports`);
}


router.post('/settings/ports', async (req, res) => {
	res.send(JSON.stringify(await getPorts()))
});


router.post('/settings/ports/:port_id', async (req, res) => {
	const port = req.body;
	const db = await openDB();
	await db.run(`update ports
                  set port=$port,
                      module=$module,
                      active=$active
                  where id = $id`, {$id: port.id, $port: port.port, $module: port.module, $active: port.active});
	res.send(JSON.stringify(await getPorts()))
});


module.exports = {settingsRouter: router, getPorts: getPorts};
