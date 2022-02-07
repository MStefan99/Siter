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
		console.log('editing', route);
		if (!route) {
			return;
		}

		this.appState.state = 'editing';
		Object.assign(this.appState.route, route);
	},


	commitRoute(route) {
		this.appState.state = 'idle';
		this.appState.route = {};

		if (!route) return;

		console.log("Updating route", route);
		// check if route is saved. update if so, otherwise create
	},


	deleteRoute(route) {
		if (!route) return;

		console.log("Deleting route", route);
		// delete route
	},


	returnToIdle() {
		this.appState.state = 'idle';
		this.appState.route = {};
	}
});
