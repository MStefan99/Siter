<template lang="pug">
h1#title Dashboard
h2#status Status
div.alert.mx-3(:class="getServerClass()") {{getServerStatus()}}
h2#routes Routes
div#route-container.row(@dragover.prevent @drop.prevent="routeDrop($event)")
	div.route.mx-3
		h3 Siter route
		div.route-mask.border-bottom
			h4 URL mask
			a#route-siter.route-link(href="#")
				b.domain siter
				span.text-muted .your-domain.tld:
				b.port 80
				span.text-muted /
		div.route-security.border-bottom
			h4 Security
			div(v-if="privateState.secure")
				p Secure:
					|
					|
					b Yes
			div(v-else)
				p Secure:
					|
					|
					b.text-danger No
				div Please enable HTTPS redirect in settings
		div.route-target.border-bottom
			h4 Target
			p
				b Siter web interface
	TransitionGroup(name="list")
		Route(v-for="route in sharedState.routes" :key="route.id" :routeData="route" draggable="true" @dragstart="routeDrag($event, route)")
	Transition(name="popup")
		RouteEditor(v-if="sharedState.appState.state !== 'idle'")
button.btn-primary.ml-3(@click="sharedState.startCreating()") Add route
</template>


<script>
'use strict';

import notify from '../../public/js/notifications';

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
		},

		routeDrag(e, route) {
			e.dataTransfer.setData('text/plain', route.id);
		},

		routeDrop(e) {
			const sourceID = e.dataTransfer.getData('text/plain');
			let targetID = e.target.closest('.route')?.getAttribute('data-route-id');

			if (!targetID) {
				for (const el of Array.from(document.getElementsByClassName('route')).reverse()) {
					const rect = el.getBoundingClientRect();
					if (e.clientY > rect.top && e.clientY < rect.bottom && e.clientX < rect.left) {
						targetID = el.getAttribute('data-route-id');
					}
				}
			}

			if (!targetID || targetID === sourceID) {
				return;
			}

			if (sourceID) {
				const sourceIndex = this.sharedState.routes.findIndex(r => r.id === sourceID);
				const sourceRoute = this.sharedState.routes[sourceIndex];
				this.sharedState.routes.splice(sourceIndex, 1);

				const targetIndex = this.sharedState.routes.findIndex(r => r.id === targetID);
				this.sharedState.routes.splice(targetIndex, 0, sourceRoute);
			}

			fetch('/api/routes/reorder', {
				method: 'POST',
				headers: {
					'Content-Type': 'application/json'
				},
				body: JSON.stringify(this.sharedState.routes.map(r => r.id))
			});
		}
	},


	beforeMount() {
		fetch('/api/routes/')
				.catch(err => {
					this.sharedState.appState.serverStatus = 'unavailable';
					notify.tell('Server unavailable',
							'Server refused to connect. Please check your firewall settings and ' +
							'restart Siter.',
							'danger');
				}).then(res => {
			if (!res.ok) {
				this.sharedState.appState.serverStatus = 'broken';
				notify.tell('Server error',
						'Server is available but returned an invalid response. ' +
						'Please restart the server and check whether you are logged in.',
						'warning');
			} else {
				this.sharedState.appState.serverStatus = 'ok';
				return res.json();
			}
		}).then(routes => this.sharedState.routes = routes);

		fetch('/api/security')
				.then(res => {
					if (res.ok) {
						return res.json();
					}
				}).then(settings => this.privateState.secure = settings.httpsRedirect);
	}
};
</script>

<style>
.list-move,
.list-enter-active,
.list-leave-active {
	transition: opacity .5s ease, transform .5s ease;
}

.list-enter-from,
.list-leave-to {
	opacity: 0;
	transform: translateX(30px);
}

.list-leave-active {
	position: absolute;
}

.popup-enter-active,
.popup-leave-active {
	transition: opacity .2s ease, transform .2s ease;
}

.popup-enter-from,
.popup-leave-to {
	transform: scale(1.1);
	opacity: 0;
}
</style>
