<template lang="pug">
div.popup-backdrop(v-if="app" @click.self="$emit('close')")
	div.popup.shadow-sm
		form(@change="validate()" @submit.prevent="save()")
			h2 {{getTitle()}}

			h3 URL mask
			div.row.form-group
				input.col(type="text" placeholder="example.com" v-model="app.server.source.hostname"
					:class="validation.domainValid? 'is-valid' : 'is-invalid'")
				span.mx-1.text-muted.col-form-label :
				input.col(type="number" min="1" max="65535" placeholder="80"
					v-model="app.server.source.port"
					:class="validation.portValid? 'is-valid' : 'is-invalid'")
				span.mx-1.text-muted.col-form-label /
				input.col(type="text" placeholder="store" v-model="app.server.source.pathname"
					:class="validation.prefixValid? 'is-valid' : 'is-invalid'")

			h3 Security
			div.form-check
				input#route-secure-checkbox(type="checkbox" v-model="app.server.source.secure")
				label(for="route-secure-checkbox") Enable HTTPS

			div(v-if="app.server.source.secure")
				div.form-group
					label(for="route-cert-file") Certificate file location
					input#route-cert-file(type="text" placeholder="/var/cert/certificate.crt"
						v-model="app.server.source.cert"
						:class="validation.certFileValid? 'is-valid' : 'is-invalid'")
					span.invalid-feedback No certificate file

				div.form-group
					label(for="route-key-file") Key file location
					input#route-key-file(type="text" placeholder="/var/cert/key.pem"
						v-model="app.server.source.key"
						:class="validation.keyFileValid? 'is-valid' : 'is-invalid'")
					span.invalid-feedback No key file

			h3 Target
			div.form-group
				div.form-check
					input#route-dir-radio(type="radio" name="target" :value="true"
						v-model="directory")
					label(for="route-dir-radio") Directory
				div.form-check
					input#route-server-radio(type="radio" name="target" :value="false"
						v-model="directory")
					label(for="route-server-radio") Web server
					span.invalid-feedback Please select the target type

			div.form-group(v-if="directory")
				label Directory location
				input(type="text" placeholder="/var/dir/" v-model="app.server.target.directory"
					:class="validation.targetDirValid? 'is-valid' : 'is-invalid'")
				span.invalid-feedback No location provided

			div.form-group(v-else)
				label Server address
				div.row
					input.col(type="text" placeholder="localhost"
						v-model="app.server.target.hostname"
						:class="validation.targetAddressValid? 'is-valid' : 'is-invalid'")
					span.mx-1.text-muted.col-form-label :
					input.col(type="number" min="1" max="65535" placeholder="80"
						v-model="app.server.target.port"
						:class="validation.targetPortValid? 'is-valid' : 'is-invalid'")

			input.btn.btn-success(type="submit" :value="getTitle()"
				:disabled="!validation.valid")
</template>


<script setup>
'use strict';

import store from './store.js';
import {onMounted, ref} from "vue";

const props = defineProps(['editing', 'app']);
const emit = defineEmits(['update', 'close']);
const app = ref(props.app);
const directory = ref(!!props.app.server.target.directory.length);
const validation = ref({});

function getTitle() {
	if (props.editing) {
		return 'Edit route';
	} else {
		return 'Add route';
	}
}

function validate() {
	const a = app.value;

	validation.value.domainValid = a.server.source.hostname !== undefined ? !!a.server.source.hostname.match(/^[a-z0-9.\-]+$/) : false;
	validation.value.portValid = +a.server.source.port > 0 && +a.server.source.port < 65536;
	validation.value.prefixValid = a.server.source.pathname !== undefined ?
		!!a.server.source.pathname.match(/^[a-z0-9\/\-]*$/) : true;

	validation.value.certFileValid = !!a.server.source.cert?.length;
	validation.value.keyFileValid = !!a.server.source.key?.length;

	validation.value.targetDirValid = !!a.server.target.directory?.length;

	validation.value.targetAddressValid = !!a.server.target.hostname?.match(/^[a-z0-9.\-]+$/);
	validation.value.targetPortValid = +a.server.target.port > 0 && +a.server.target.port < 65536;

	validation.value.valid =
		// Check URL mask
		validation.value.domainValid && validation.value.portValid && validation.value.prefixValid
		// Check security if enabled
		&& (a.server.source.secure? validation.value.certFileValid && validation.value.keyFileValid: true)
		// Check directory if enabled
		&& (directory.value === true && validation.value.targetDirValid
			// Check server if enabled
			|| directory.value === false && validation.value.targetAddressValid && validation.value.targetPortValid);
}

function save() {
	validate();

	if (!validation.value.valid) {
		return;
	}

	emit('update', app.value);
	store.saveRoute(app.value);
}


onMounted(validate);
</script>
