<template lang="pug">
div.popup-backdrop(@click="closePopup($event)")
	div.popup.shadow-sm
		form(@change="updateValidation()" @submit.prevent="submit()")
			h2 {{getTitle()}}

			h3 URL mask
			div.row.form-group
				input.col(type="text" placeholder="example.com" v-model="sharedState.appState.route.domain"
					:class="privateState.form.domainValid? 'is-valid' : 'is-invalid'")
				span.mx-1.text-muted.col-form-label :
				input.col(type="number" min="1" max="65535" placeholder="80"
					v-model="sharedState.appState.route.port"
					:class="privateState.form.portValid? 'is-valid' : 'is-invalid'")
				span.mx-1.text-muted.col-form-label /
				input.col(type="text" placeholder="store" v-model="sharedState.appState.route.prefix"
					:class="privateState.form.prefixValid? 'is-valid' : 'is-invalid'")

			h3 Security
			div.form-check
				input#route-secure-checkbox(type="checkbox" v-model="sharedState.appState.route.secure")
				label(for="route-secure-checkbox") Enable HTTPS

			div(v-if="sharedState.appState.route.secure")
				div.form-group
					label(for="route-cert-file") Certificate file location
					input#route-cert-file(type="text" placeholder="/var/cert/certificate.crt"
            v-model="sharedState.appState.route.certFile"
						:class="privateState.form.certFileValid? 'is-valid' : 'is-invalid'")
					span.invalid-feedback No certificate file

				div.form-group
					label(for="route-key-file") Key file location
					input#route-key-file(type="text" placeholder="/var/cert/key.pem"
            v-model="sharedState.appState.route.keyFile"
						:class="privateState.form.keyFileValid? 'is-valid' : 'is-invalid'")
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
				input(type="text" placeholder="/var/dir/" v-model="sharedState.appState.route.tDirectory"
					:class="privateState.form.targetDirValid? 'is-valid' : 'is-invalid'")
				span.invalid-feedback No location provided

			div.form-group(v-if="sharedState.appState.route.target === 'server'")
				label Server address
				div.row
					input.col(type="text" placeholder="localhost"
						v-model="sharedState.appState.route.tAddr"
						:class="privateState.form.targetAddressValid? 'is-valid' : 'is-invalid'")
					span.mx-1.text-muted.col-form-label :
					input.col(type="number" min="1" max="65535" placeholder="80"
						v-model="sharedState.appState.route.tPort"
						:class="privateState.form.targetPortValid? 'is-valid' : 'is-invalid'")

			input.btn.btn-success(type="submit" :value="getTitle()"
				:disabled="!privateState.form.valid")
</template>


<script>
'use strict';

import store from './store.js';


export default {
	name: 'RouteEditor',
	data() {
		return {
			sharedState: store,
			privateState: {
				form: {}
			}
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
		},


		updateValidation() {
			const route = this.sharedState.appState.route;
			const result = this.privateState.form;

			result.domainValid = route.domain !== undefined? !!route.domain.match(/^[a-z0-9.\-]+$/) : false;
			result.portValid = +route.port > 0 && +route.port < 65536;
			result.prefixValid = route.prefix !== undefined?
					!!route.prefix.match(/^[a-z0-9\/\-]*$/) : true;

			result.certFileValid = !!route.certFile?.length;
			result.keyFileValid = !!route.keyFile?.length;

			result.targetDirValid = !!route.tDirectory?.length;

			result.targetAddressValid = !!route.tAddr?.match(/^[a-z0-9.\-]+$/);
			result.targetPortValid = +route.tPort > 0 && +route.port < 65536;

			result.valid = !(
					// Check URL mask
					(!result.domainValid || !result.portValid || !result.prefixValid || !route.target)
					// Check security if enabled
					|| (route.secure && (!result.certFileValid || !result.keyFileValid))
					// Check directory if enabled
					|| (route.target === 'directory' && !result.targetDirValid)
					// Check server if enabled
					|| (route.target === 'server' && (!result.targetAddressValid || !result.targetPortValid)));
		},


		submit() {
			const route = this.sharedState.appState.route;
			const result = this.privateState.form;

			this.updateValidation();

			if (!result.valid) {
				return;
			}

			this.sharedState.commitRoute(route);
		}
	},


	beforeMount() {
		this.updateValidation();
	}
};
</script>
