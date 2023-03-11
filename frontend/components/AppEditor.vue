<template lang="pug">
.popup-backdrop(v-if="app" @click.self="$emit('close')")
	.popup.shadow-sm
		form(@submit.prevent="save()")
			h2 App settings

			h3 Name
			.form-group
				label(for="name-input") App name
				input#name-input(type="text" v-model="app.name" placeholder="Name")

			h3 Hosting
			.form-group
				.form-check
					input#route-check(type="checkbox" v-model="app.hosting.enabled" :true-value="true" :false-value="false")
					label(for="route-check") Enable hosting

			.hosting(v-if="app.hosting?.enabled")
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
				.form-group
					.form-check
						input#source-secure-check(type="checkbox" v-model="app.hosting.source.secure")
						label(for="source-secure-check") Enable HTTPS
				div(v-if="app.hosting.source.secure")
					.form-group
						label(for="cert-input") Certificate file
						FilePicker#cert-input(v-model="app.hosting.source.cert" placeholder="No file selected"
							prompt="Choose certificate file" :class="validation.certFileValid? 'is-valid' : 'is-invalid'")
						span.invalid-feedback No certificate file
					.form-group
						label(for="key-input") Key file
						FilePicker#key-input(v-model="app.hosting.source.key" placeholder="No file selected"
							prompt="Choose key file" :class="validation.keyFileValid? 'is-valid' : 'is-invalid'")
						span.invalid-feedback No key file

				h3 Target
				.form-group
					.form-check
						input#target-dir-radio(type="radio" name="target" :value="true" v-model="directory")
						label(for="target-dir-radio") Directory
					.form-check
						input#target-server-radio(type="radio" name="target" :value="false" v-model="directory")
						label(for="target-server-radio") Web server
						span.invalid-feedback Please select the target type
				div(v-if="directory")
					.form-group
						label Directory location
						FilePicker(v-model="app.hosting.target.directory" :dir-mode="true" placeholder="No directory selected"
							:class="validation.targetDirValid? 'is-valid' : 'is-invalid'")
						span.invalid-feedback No location provided
					.form-group
						.form-check
							input#route-spa(type="checkbox" v-model="app.hosting.target.routing" :true-value="false" :false-value="true")
							label(for="route-spa") Disable routing (SPA mode)
				.form-group(v-else)
					label Server address
					.row
						input.col(type="text" placeholder="localhost" v-model="app.hosting.target.hostname"
							:class="validation.targetAddressValid? 'is-valid' : 'is-invalid'")
						span.mx-1.text-muted.col-form-label :
						input.col(type="number" min="1" max="65535" placeholder="80" v-model="app.hosting.target.port"
							:class="validation.targetPortValid? 'is-valid' : 'is-invalid'")

				h3 CORS
				.form-group
					label CORS allowed origins
					ArrayEditor(v-model="app.hosting.cors.origins" title="Origins")

			h3 Process manager
			.form-group
				.form-check
					input#pm-check(type="checkbox" v-model="app.pm.enabled" :true-value="true" :false-value="false")
					label(for="pm-check") Enable process manager
			.pm(v-if="app.pm?.enabled")
				ProcessEditor(v-model="app.pm.processes")

			h3 Analytics
			.form-group
				.form-check
					input#analytics-check(type="checkbox" v-model="app.analytics.enabled" :true-value="true" :false-value="false")
					label(for="analytics-check") Enable analytics
			.analytics(v-if="app.analytics?.enabled")
				p Analytics
				.form-group
					label(for="analytics-url-input") Crash Course address
					input#analytics-url-input(type="text" v-model="app.analytics.url")
				.form-group
					label(for="analytics-url-key") Crash Course telemetry key
					input#analytics-url-input(type="text" v-model="app.analytics.key")

			input.btn.btn-success(type="submit" value="Save app" :disabled="!validation.valid")
</template>


<script setup>
'use strict';

import {computed, onMounted, ref, toRaw} from "vue";
import {validate} from "../../common/validate";
import FilePicker from "./FilePicker.vue";
import ProcessEditor from "./ProcessEditor.vue";
import ArrayEditor from "./ArrayEditor.vue";

const props = defineProps(['modelValue']);
const emit = defineEmits(['update:modelValue', 'close']);
const app = ref(structuredClone(toRaw(props.modelValue)));
const directory = ref(!!props.modelValue.hosting.target.directory.length);
const validation = computed(() => validate(app.value));

function save() {
	!directory.value && (app.value.hosting.target.directory = '');

	if (!validate(app.value)) {
		return;
	}

	emit('update:modelValue', app.value);
	emit('close');
}


onMounted(() => validate(app.value));
</script>
