'use strict';

const smartConfig = require('@mstefan99/smart-config');


module.exports = new Promise(resolve => {
	smartConfig().then(c => {
		resolve(c);
	});
});
