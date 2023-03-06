'use strict';

const libSession = require('./session');


async function getSession(req, res, next) {
	if (!req.cookies) {
		throw new Error('This middleware requires cookie-parser');
	}
	if (!req.cookies.siterSESSION) {
		req.session = null;
	} else {
		req.session = await libSession.getSessionByID(req.cookies.siterSESSION);
	}
	res.locals.session = req.session;

	next();
}


function redirectIfNotAuthorized(req, res, next) {
	if (req.session === undefined) {
		throw new Error('Please call getSession middleware first');
	}
	if (!req.session) {
		res.redirect(303, '/login/');
	} else {
		next();
	}
}


function rejectIfNotAuthorized(req, res, next) {
	if (!req.session) {
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
