'use strict';

export default class ServerSettings {
	settings;

	async pull() {
		const res = (await fetch('/get_settings/', {
			method: 'GET'
		}).catch(function() {
			throw new Error('Server not available');
		}));
		this.settings = JSON.parse(await res.text());
		return this;
	}

	get(key) {
		if (key == null) {
			return this.settings;
		} else {
			return this.settings[key];
		}
	}

	json(key) {
		if (key == null) {
			return JSON.stringify(this.settings);
		} else {
			return JSON.stringify(this.settings[key]);
		}
	}
}
