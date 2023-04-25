'use strict';

const libSession = require('./session');

async function getSession(req, res, next) {
	if (!req.cookies) {
		throw new Error('This middleware requires cookie-parser');
	}
	if (!req.cookies['siter-session']) {
		req.session = null;
	} else {
		req.session = await libSession.getSessionByID(req.cookies['siter-session']);
	}
	res.locals.session = req.session;

	next();
}

function redirectIfNotAuthorized(req, res, next) {
	if (req.session === undefined) {
		throw new Error('Please call getSession middleware first');
	}
	if (!req.session) {
		res.redirect(303, '/login');
	} else if (req.session.challenge) {
		res.redirect(303, '/challenge');
	} else {
		next();
	}
}

function rejectIfNotAuthorized(req, res, next) {
	if (!req.session || req.session.challenge) {
		res.status(403).send('Not authorized');
	} else {
		next();
	}
}

module.exports = {
	getSession: () => getSession,
	redirectIfNotAuthorized: () => redirectIfNotAuthorized,
	rejectIfNotAuthorized: () => rejectIfNotAuthorized
};
