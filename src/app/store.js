'use strict';

import {reactive} from 'vue';


export default reactive({
	routes: [],

	getRoute(id) {
		return this.routes.find(r => r.id === id);
	},

	saveRoute(route) {
		const idx = this.routes.findIndex(r => r.id === route.id);

		// TODO: add error handling
		if (idx >= 0) {  // Route already exists, editing
			fetch('/api/routes/' + route.id + '/', {
				method: 'PUT',
				headers: {
					'Content-Type': 'application/json'
				},
				body: JSON.stringify({route})
			})
					.then(res => res.json())
					.then(route => this.routes[idx] = route);
		} else {  // New route, adding
			fetch('/api/routes/', {
				method: 'POST',
				headers: {
					'Content-Type': 'application/json'
				},
				body: JSON.stringify({route})
			})
					.then(res => res.json())
					.then(route => this.routes.push(route));
		}
	},

	deleteRoute(route) {
		const idx = this.routes.findIndex(r => r.id === route.id);

		// TODO: add error handling
		if (idx >= 0) {
			fetch('/api/routes/' + route.id + '/', {
				method: 'DELETE'
			})
					.then(res => {
						if (res.ok) {
							this.routes.splice(idx, 1);
						}
					});
		}
	}
});
