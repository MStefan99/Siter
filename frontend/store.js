'use strict';

import {reactive} from 'vue';


export default reactive({
	apps: [],

	getApp(id) {
		return this.apps.find(r => r.id === id);
	},

	saveApp(app) {
		const idx = this.apps.findIndex(r => r.id === app.id);

		// TODO: add error handling
		if (idx >= 0) {  // app already exists, editing
			fetch('/api/apps/' + app.id + '/', {
				method: 'PUT',
				headers: {
					'Content-Type': 'application/json'
				},
				body: JSON.stringify({app})
			})
					.then(res => res.json())
					.then(app => this.apps[idx] = app);
		} else {  // New app, adding
			fetch('/api/apps/', {
				method: 'POST',
				headers: {
					'Content-Type': 'application/json'
				},
				body: JSON.stringify({app})
			})
					.then(res => res.json())
					.then(app => this.apps.push(app));
		}
	},

	deleteApp(app) {
		const idx = this.apps.findIndex(r => r.id === app.id);

		// TODO: add error handling
		if (idx >= 0) {
			fetch('/api/apps/' + app.id + '/', {
				method: 'DELETE'
			})
					.then(res => {
						if (res.ok) {
							this.apps.splice(idx, 1);
						}
					});
		}
	}
});
