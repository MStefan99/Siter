<template lang="pug">
.popup-backdrop(v-if="app" @click.self="$emit('close')")
	.popup.shadow-sm
		form(@submit.prevent="save()")
			h2 {{getTitle()}}

			h3 Hosting
			.form-check
				input#route-check(type="checkbox" v-model="app.hosting.active" :true-value="true" :false-value="false")
				label(for="route-check") Enable hosting

			.hosting(v-if="app.hosting?.active")
				h3 URL mask
				.row.form-group
					input.col(type="text" placeholder="example.com" v-model="app.hosting.source.hostname"
						:class="validation.domainValid? 'is-valid' : 'is-invalid'")
					span.mx-1.text-muted.col-form-label :
					input.col(type="number" min="1" max="65535" placeholder="80"
						v-model="app.hosting.source.port"
						:class="validation.portValid? 'is-valid' : 'is-invalid'")
					span.mx-1.text-muted.col-form-label /
					input.col(type="text" placeholder="store" v-model="app.hosting.source.pathname"
						:class="validation.prefixValid? 'is-valid' : 'is-invalid'")

				h3 Security
				.form-check
					input#app-secure-checkbox(type="checkbox" v-model="app.hosting.source.secure")
					label(for="app-secure-checkbox") Enable HTTPS
				div(v-if="app.hosting.source.secure")
					.form-group
						label(for="app-cert-file") Certificate file location
						input#app-cert-file(type="text" placeholder="/var/cert/certificate.crt"
							v-model="app.hosting.source.cert"
							:class="validation.certFileValid? 'is-valid' : 'is-invalid'")
						span.invalid-feedback No certificate file
					.form-group
						label(for="app-key-file") Key file location
						input#app-key-file(type="text" placeholder="/var/cert/key.pem"
							v-model="app.hosting.source.key"
							:class="validation.keyFileValid? 'is-valid' : 'is-invalid'")
						span.invalid-feedback No key file

				h3 Target
				.form-group
					.form-check
						input#app-dir-radio(type="radio" name="target" :value="true"
							v-model="directory")
						label(for="app-dir-radio") Directory
					.form-check
						input#app-route-radio(type="radio" name="target" :value="false"
							v-model="directory")
						label(for="app-route-radio") Web route
						span.invalid-feedback Please select the target type
				.form-group(v-if="directory")
					label Directory location
					input(type="text" placeholder="/var/dir/" v-model="app.hosting.target.directory"
						:class="validation.targetDirValid? 'is-valid' : 'is-invalid'")
					span.invalid-feedback No location provided
				.form-group(v-else)
					label route address
					.row
						input.col(type="text" placeholder="localhost"
							v-model="app.hosting.target.hostname"
							:class="validation.targetAddressValid? 'is-valid' : 'is-invalid'")
						span.mx-1.text-muted.col-form-label :
						input.col(type="number" min="1" max="65535" placeholder="80"
							v-model="app.hosting.target.port"
							:class="validation.targetPortValid? 'is-valid' : 'is-invalid'")

			h3 Process manager
			.form-check
				input#pm-check(type="checkbox" v-model="app.pm.active" :true-value="true" :false-value="false")
				label(for="pm-check") Enable process manager
			.pm(v-if="app.pm?.active")
				p Processes

			h3 Analytics
			.form-check
				input#analytics-check(type="checkbox" v-model="app.analytics.active" :true-value="true" :false-value="false")
				label(for="analytics-check") Enable process manager
			.pm(v-if="app.analytics?.active")
				p Analytics

			input.btn.btn-success(type="submit" :value="getTitle()"
				:disabled="!validation.valid")
</template>


<script setup>
'use strict';

import store from '../store.js';
import {computed, onMounted, ref} from "vue";
import {validate} from "../../common/validate";

const props = defineProps(['editing', 'app']);
const emit = defineEmits(['update', 'close']);
const app = ref(props.app);
const directory = ref(!!props.app.hosting.target.directory.length);
const validation = computed(() => validate(app.value));

function getTitle() {
	if (props.editing) {
		return 'Edit app';
	} else {
		return 'Add app';
	}
}

function save() {
	if (!validate(app.value)) {
		return;
	}

	store.saveApp(app.value);
	props.editing && emit('update', app.value);
	emit('close');
}


onMounted(() => validate(app.value));
</script>
