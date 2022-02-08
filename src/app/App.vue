<template lang="pug">
h1#title Dashboard
h2#status Status
div.alert.mx-3(:class="getServerClass()") {{getServerStatus()}}
h2#routes Routes
div#route-container.row
	div.route.mx-3
		h3 Siter route
		div.route-mask.border-bottom
			h4 URL mask
			a#route-siter.route-link(href='#')
				b.domain siter
				span.text-muted .your-domain.tld:
				b.port 80
				span.text-muted /
		div.route-security.border-bottom
			h4 Security
			p Secure: #[b= secure? 'yes' : 'no']
			if !secure
				p Please enable HTTPS in settings
		div.route-target.border-bottom
			h4 Target
			p
				b Siter web interface
	Route(v-for="route in sharedState.routes" :routeData="route")
	RouteEditor(v-if="sharedState.appState.state !== 'idle'")
button.btn-primary.ml-3(@click="sharedState.startCreating()") Add route
</template>


<script>
'use strict';

import notify from '../../public/js/notifications';
import createMenu from './navmenu.js';

import store from './store.js';
import Route from './Route.vue';
import RouteEditor from './RouteEditor.vue';


export default {
	components: {
		Route,
		RouteEditor
	},
	name: 'App',
	data() {
		return {
			sharedState: store,
			privateState: {}
		};
	},
	methods: {
		getServerStatus() {
			switch (this.sharedState.appState.serverStatus) {
				case 'pending':
					return 'Waiting for server...';
				case 'unavailable':
					return 'Server did not respond. Please check if the server is working.';
				case 'broken':
					return 'Server is available but received response was invalid. Please check server version.';
				case 'ok':
					return 'Your server is working fine!';
			}
		},


		getServerClass() {
			switch (this.sharedState.appState.serverStatus) {
				case 'pending':
				case 'broken':
					return 'alert-warning';
				case 'unavailable':
					return 'alert-danger';
				case 'ok':
					return 'alert-success';
			}
		}
	},


	async beforeMount() {
		const res = await fetch('/api/v0.1/routes/')
				.catch(err => {
					this.sharedState.appState.serverStatus = 'unavailable';
					notify.tell('Server unavailable',
							'Server refused to connect. Please check your firewall settings and ' +
							'restart Siter.',
							'danger');
				});

		if (!res.ok) {
			this.sharedState.appState.serverStatus = 'broken';
			notify.tell('Server error',
					'Server is available but returned an invalid response. ' +
					'Please restart the server and check whether you are logged in.',
					'warning');
		} else {
			this.sharedState.appState.serverStatus = 'ok';
			this.sharedState.routes = await res.json();
		}
	},


	updated() {
		createMenu('#dashboard h2, a.route-link');
	}
};
</script>
