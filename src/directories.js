const express = require('express');
const router = express.Router();
const openDB = require('./lib/db');
const {redirectIfNotAuthorized} = require('./auth');


router.use(redirectIfNotAuthorized);
router.use(express.json());


async function getDirectories() {
	const db = await openDB();
	const directories = await db.all(`select id,
                                             path,
                                             active,
                                             allow_override as allowOverride
                                      from directories`);
	for (const directory of directories) {
		directory.rules = await db.all(`select type,
                                               allow,
                                               dr.active
                                        from directories d
                                                 left join directory_rules dr on d.id = dr.directory_id
                                        where d.id = $did
		`, {$did: directory.id});
		for (const rule of directory.rules) {
			rule.entities = [];
			if (rule.type !== 'all') {
				await db.each(`select *
                               from directory_rules dr
                                        left join directory_rule_entities dre on dr.id = dre.rule_id
				`, (err, row) => {
					if (row.entity) {
						rule.entities.push(row.entity);
					}
				});
			}
		}
	}
	return directories;
}


router.post('/settings/directories', async (req, res) => {
	res.send(JSON.stringify(await getDirectories()));
});


router.post('/settings/directories/add', async (req, res) => {
	const db = await openDB();
	const directory = req.body;
	await db.run(`insert into directories(path, active, allow_override)
                  values ($path, $active, $allowOverride)`, {
		$path: directory.path,
		$active: directory.active,
		$allowOverride: directory.allowOverride
	});
	const did = (await db.get(`select seq
                               from sqlite_sequence
                               where name = 'directories'`)).seq;
	for (const rule of directory.rules) {
		await db.run(`insert into directory_rules(directory_id, type, allow, active)
                      values ($id, $type, $allow, $active)`, {
			$id: did,
			$type: rule.type,
			$allow: rule.allow,
			$active: rule.active
		});
		const rid = (await db.get(`select seq
                                   from sqlite_sequence
                                   where name = 'directory_rules'`)).seq;
		if (rule.type !== 'all') {
			for (const entity of rule.entities) {
				db.run(`insert into directory_rule_entities(rule_id, entity)
                        values ($id, $entity)`,
					{$id: rid, $entity: entity});
			}
		}
	}
	res.send(JSON.stringify(await getDirectories()));
});


router.post('/settings/directories/rules/edit/:ruleId', async (rew, res) => {
	
	res.send(JSON.stringify(await getDirectories()));
});


module.exports = {
	directoriesRouter: router,
	getDirectories: getDirectories
};
