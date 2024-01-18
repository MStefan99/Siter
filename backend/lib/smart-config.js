'use strict';

const fs = require('fs');
const Configurer = require('./configurer');

module.exports = function (filePath) {
	return new Promise(resolve => {
		const config = new Configurer(filePath);

		config._load().then(() => {
			const proxy = {
				get(target, prop, receiver) {
					const obj = Reflect.get(target, prop, receiver);

					if (obj === null) {
						return obj;
					} else if ((typeof obj === 'object' || typeof obj === 'function')
						&& Object.getOwnPropertyDescriptor(target, prop)?.configurable) {
						return new Proxy(obj, proxy);
					} else {
						return obj;
					}
				},
				set(target, prop, value, receiver) {
					Reflect.set(target, prop, value, receiver);
					config._save();
					return true;
				}
			};

			const smartConfig = new Proxy(config, proxy);
			// fs.watchFile(filePath, config._load);

			resolve(smartConfig);
		});
	});
};
