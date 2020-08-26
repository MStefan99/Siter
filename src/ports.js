const express = require('express');
const router = express.Router();
const openDB = require('./lib/db');
const {redirectIfNotAuthorized, isAdmin} = require('./auth');


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


router.post('/settings/ports/add', async (req, res) => {
	if (await isAdmin(req.cookies.siterID)) {
		const port = req.body;
		const db = await openDB();
		await db.run(`insert into ports(port, module, active)
                      values ($port, $module, $active)`,
			{$port: port.port, $module: port.module, $active: port.active})
			.catch(() => res.status(400));
	} else {
		res.status(403);
	}
	res.send(JSON.stringify(await getPorts()));
});


router.post('/settings/ports/edit/:port_id', async (req, res) => {
	if (await isAdmin(req.cookies.siterID)) {
		const port = req.body;
		const db = await openDB();
		await db.run(`update ports
                      set port=$port,
                          module=$module,
                          active=$active
                      where id = $id`, {$id: port.id, $port: port.port, $module: port.module, $active: port.active})
			.catch(() => res.status(400));
	} else {
		res.status(403);
	}
	res.send(JSON.stringify(await getPorts()));
});


router.post('/settings/ports/delete/:port_id', async (req, res) => {
	if (await isAdmin(req.cookies.siterID)) {
		const port = req.body;
		const db = await openDB();
		await db.run(`delete
                      from ports
                      where id = $portId`, {$portId: port.id})
			.catch(() => res.status(400));
	} else {
		res.status(403);
	}
	res.send(JSON.stringify(await getPorts()));
});

module.exports = {
	portsRouter: router,
	getPorts: getPorts
};
