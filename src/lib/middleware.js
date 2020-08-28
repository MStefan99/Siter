'use strict';

const libSession = require('./session');


module.exports = {
	getSession: async (req, res, next) => {
		if (!req.cookies.siterSESSION) {
			req.session = null;
		} else {
			req.session = await libSession.getSessionByID(req.cookies.siterSESSION);
		}
		res.locals.session = req.session;

		next();
	},

	redirectIfNotAuthorized: async (req, res, next) => {
		if (req.session === undefined) {
			throw new Error('Please call getSession middleware first');
		}
		if (!req.session) {
			res.redirect(303, '/login/');
		} else {
			next();
		}
	}
};
