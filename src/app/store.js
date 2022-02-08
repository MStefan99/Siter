'use strict';

import {reactive} from 'vue';


export default reactive({
	routes: [],
	appState: {
		state: 'idle',
		serverStatus: 'pending',
		route: {}
	},


	startCreating() {
		this.appState.state = 'creating';
		this.appState.route = {};
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
			this.returnToIdle();
			return;
		}

		const idx = this.routes.findIndex(r => r.id === route.id);

		// TODO: add error handling
		if (idx >= 0) {  // Route already exists, editing
			fetch('/api/v0.1/routes/' + route.id + '/', {
				method: 'PUT',
				headers: {
					'Content-Type': 'application/json'
				},
				body: JSON.stringify({route})
			})
					.then(res => res.json())
					.then(route => this.routes[idx] = route);
		} else {  // New route, adding
			fetch('/api/v0.1/routes/', {
				method: 'POST',
				headers: {
					'Content-Type': 'application/json'
				},
				body: JSON.stringify({route})
			})
					.then(res => res.json())
					.then(route => this.routes.push(route));
		}
		this.returnToIdle();
	},


	deleteRoute(route) {
		if (!route) {
			this.returnToIdle();
			return;
		}

		const idx = this.routes.findIndex(r => r.id === route.id);

		// TODO: add error handling
		if (idx >= 0) {
			fetch('/api/v0.1/routes/' + route.id + '/', {
				method: 'DELETE'
			})
					.then(res => {
						if (res.ok) {
							this.routes.splice(idx, 1);
						}
					});
		}
		this.returnToIdle();
	},


	returnToIdle() {
		this.appState.state = 'idle';
		this.appState.route = {};
	}
});
