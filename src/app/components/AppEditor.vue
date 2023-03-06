<template lang="pug">
div.popup-backdrop(v-if="app" @click.self="$emit('close')")
	div.popup.shadow-sm
		form(@change="validate()" @submit.prevent="save()")
			h2 {{getTitle()}}

			h3 URL mask
			div.row.form-group
				input.col(type="text" placeholder="example.com" v-model="app.route.source.hostname"
					:class="validation.domainValid? 'is-valid' : 'is-invalid'")
				span.mx-1.text-muted.col-form-label :
				input.col(type="number" min="1" max="65535" placeholder="80"
					v-model="app.route.source.port"
					:class="validation.portValid? 'is-valid' : 'is-invalid'")
				span.mx-1.text-muted.col-form-label /
				input.col(type="text" placeholder="store" v-model="app.route.source.pathname"
					:class="validation.prefixValid? 'is-valid' : 'is-invalid'")

			h3 Security
			div.form-check
				input#app-secure-checkbox(type="checkbox" v-model="app.route.source.secure")
				label(for="app-secure-checkbox") Enable HTTPS

			div(v-if="app.route.source.secure")
				div.form-group
					label(for="app-cert-file") Certificate file location
					input#app-cert-file(type="text" placeholder="/var/cert/certificate.crt"
						v-model="app.route.source.cert"
						:class="validation.certFileValid? 'is-valid' : 'is-invalid'")
					span.invalid-feedback No certificate file

				div.form-group
					label(for="app-key-file") Key file location
					input#app-key-file(type="text" placeholder="/var/cert/key.pem"
						v-model="app.route.source.key"
						:class="validation.keyFileValid? 'is-valid' : 'is-invalid'")
					span.invalid-feedback No key file

			h3 Target
			div.form-group
				div.form-check
					input#app-dir-radio(type="radio" name="target" :value="true"
						v-model="directory")
					label(for="app-dir-radio") Directory
				div.form-check
					input#app-route-radio(type="radio" name="target" :value="false"
						v-model="directory")
					label(for="app-route-radio") Web route
					span.invalid-feedback Please select the target type

			div.form-group(v-if="directory")
				label Directory location
				input(type="text" placeholder="/var/dir/" v-model="app.route.target.directory"
					:class="validation.targetDirValid? 'is-valid' : 'is-invalid'")
				span.invalid-feedback No location provided

			div.form-group(v-else)
				label route address
				div.row
					input.col(type="text" placeholder="localhost"
						v-model="app.route.target.hostname"
						:class="validation.targetAddressValid? 'is-valid' : 'is-invalid'")
					span.mx-1.text-muted.col-form-label :
					input.col(type="number" min="1" max="65535" placeholder="80"
						v-model="app.route.target.port"
						:class="validation.targetPortValid? 'is-valid' : 'is-invalid'")

			input.btn.btn-success(type="submit" :value="getTitle()"
				:disabled="!validation.valid")
</template>


<script setup>
'use strict';

import store from '../store.js';
import {onMounted, ref} from "vue";

const props = defineProps(['editing', 'app']);
const emit = defineEmits(['update', 'close']);
const app = ref(props.app);
const directory = ref(!!props.app.route.target.directory.length);
const validation = ref({});

function getTitle() {
	if (props.editing) {
		return 'Edit app';
	} else {
		return 'Add app';
	}
}

function validate() {
	const a = app.value;

	validation.value.domainValid = a.route.source.hostname !== undefined ? !!a.route.source.hostname.match(/^[a-z0-9.\-]+$/) : false;
	validation.value.portValid = +a.route.source.port > 0 && +a.route.source.port < 65536;
	validation.value.prefixValid = a.route.source.pathname !== undefined ?
		!!a.route.source.pathname.match(/^[a-z0-9\/\-]*$/) : true;

	validation.value.certFileValid = !!a.route.source.cert?.length;
	validation.value.keyFileValid = !!a.route.source.key?.length;

	validation.value.targetDirValid = !!a.route.target.directory?.length;

	validation.value.targetAddressValid = !!a.route.target.hostname?.match(/^[a-z0-9.\-]+$/);
	validation.value.targetPortValid = +a.route.target.port > 0 && +a.route.target.port < 65536;

	validation.value.valid =
		// Check URL mask
		validation.value.domainValid && validation.value.portValid && validation.value.prefixValid
		// Check security if enabled
		&& (a.route.source.secure? validation.value.certFileValid && validation.value.keyFileValid: true)
		// Check directory if enabled
		&& (directory.value === true && validation.value.targetDirValid
			// Check route if enabled
			|| directory.value === false && validation.value.targetAddressValid && validation.value.targetPortValid);
}

function save() {
	validate();

	if (!validation.value.valid) {
		return;
	}

	emit('update', app.value);
	store.saveApp(app.value);
}


onMounted(validate);
</script>
