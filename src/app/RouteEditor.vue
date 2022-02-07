<template lang="pug">
div.popup-backdrop(@click="closePopup($event)")
	div.popup.shadow-sm
		form
			h2 {{getTitle()}}

			h3 URL mask
			div.row.form-group
				input.col(type="text" placeholder="example.com" v-model="sharedState.appState.route.domain")
				span.mx-1.text-muted.col-form-label :
				input.col(type="number" min="1" max="65535" placeholder="80"
					v-model="sharedState.appState.route.port")
				span.mx-1.text-muted.col-form-label /
				input.col(type="text" placeholder="store" v-model="sharedState.appState.route.prefix")

			h3 Security
			div.form-check
				input#route-secure-checkbox(type="checkbox" v-model="sharedState.appState.route.secure")
				label(for="route-secure-checkbox") Enable HTTPS

			div(v-if="sharedState.appState.route.secure")
				div.form-group
					label(for="route-cert-file") Certificate file location
					input#route-cert-file(type="text" placeholder="/var/cert/certificate.crt")
					span.invalid-feedback No certificate file

				div.form-group
					label(for="route-key-file") Key file location
					input#route-key-file(type="text" placeholder="/var/cert/key.pem")
					span.invalid-feedback No key file

			h3 Target
			div.form-group
				div.form-check
					input#route-dir-radio(type="radio" name="target" value="directory"
						v-model="sharedState.appState.route.target")
					label(for="route-dir-radio") Directory
				div.form-check
					input#route-server-radio(type="radio" name="target" value="server"
						v-model="sharedState.appState.route.target")
					label(for="route-server-radio") Web server
					span.invalid-feedback Please select the target type

			div.form-group(v-if="sharedState.appState.route.target === 'directory'")
				label Directory location
				input(type="text" placeholder="/var/dir/" v-model="sharedState.appState.route.tDirectory")
				span.invalid-feedback No location provided

			div.form-group(v-if="sharedState.appState.route.target === 'server'")
				label Server address
				div.row
					input.col(type="text" placeholder="localhost"
						v-model="sharedState.appState.route.tAddr")
					span.mx-1.text-muted.col-form-label :
					input.col(type="number" min="1" max="65535" placeholder="80"
						v-model="sharedState.appState.route.tPort")
					span.invalid-feedback Invalid port provided

			input.btn.btn-success(type="submit" :value="getTitle()")
</template>


<script>
'use strict';

import store from './store.js';


export default {
	name: 'RouteEditor',
	data() {
		return {
			sharedState: store,
			privateState: {}
		};
	},
	methods: {
		getTitle() {
			switch (this.sharedState.appState.state) {
				case 'editing':
					return 'Edit route';
				case 'creating':
					return 'Add a new route';
				default:
					return 'Invalid app state!';
			}
		},


		closePopup(event) {
			if (event.target.classList.contains('popup-backdrop')) {
				this.sharedState.returnToIdle();
			}
		}
	}
};
</script>
