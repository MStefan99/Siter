'use strict';

import {reactive} from 'vue';


export default reactive({
	routes: [],
	appState: {
		state: 'idle',
		route: {}
	},


	startCreating() {
		this.appState.state = 'creating';
	},


	startEditing(route) {
		if (!route) {
			return;
		}

		this.appState.state = 'editing';
		Object.assign(this.appState.route, route);
	},


	commitRoute(route) {
		this.appState.state = 'idle';
		this.appState.route = {};

		if (!route) {
			return;
		}

		const idx = this.routes.findIndex(r => r.id === route.id);

		// TODO: add error handling
		if (idx >= 0) {  // Route already exists, editing
			this.routes[idx] = route;
			fetch('/api/v0.1/routes/' + route.id + '/', {
				method: 'PUT',
				headers: {
					'Content-Type': 'application/json'
				},
				body: JSON.stringify({route})
			});
		} else {  // New route, adding
			this.routes.push(route);
			fetch('/api/v0.1/routes/', {
				method: 'POST',
				headers: {
					'Content-Type': 'application/json'
				},
				body: JSON.stringify({route})
			});
		}
	},


	deleteRoute(route) {
		if (!route) {
			return;
		}

		console.log('Deleting route', route);
		// delete route
	},


	returnToIdle() {
		this.appState.state = 'idle';
		this.appState.route = {};
	}
});
