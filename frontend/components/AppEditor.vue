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
				h3 Source
				.row.form-group
					input.col(type="text" placeholder="example.com" v-model="app.hosting.source.hostname"
						:class="validation.hosting.source.hostname? 'is-valid' : 'is-invalid'")
					span.mx-1.text-muted.col-form-label :
					input.col(type="number" min="1" max="65535" placeholder="80"
						v-model="app.hosting.source.port"
						:class="validation.hosting.source.port? 'is-valid' : 'is-invalid'")
					span.mx-1.text-muted.col-form-label /
					input.col(type="text" placeholder="store" v-model="app.hosting.source.pathname"
						:class="validation.hosting.source.pathname? 'is-valid' : 'is-invalid'")

				h3 Security
				.form-group
					.form-check
						input#source-secure-check(type="checkbox" v-model="app.hosting.source.secure")
						label(for="source-secure-check") Enable HTTPS
				div(v-if="app.hosting.source.secure")
					.form-group
						label(for="cert-input") Certificate file
						FilePicker#cert-input(v-model="app.hosting.source.cert" placeholder="No file selected"
							prompt="Choose certificate file" :class="validation.hosting.source.cert? 'is-valid' : 'is-invalid'")
						span.invalid-feedback No certificate file
					.form-group
						label(for="key-input") Key file
						FilePicker#key-input(v-model="app.hosting.source.key" placeholder="No file selected"
							prompt="Choose key file" :class="validation.hosting.source.key? 'is-valid' : 'is-invalid'")
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
							:class="validation.hosting.target.directory? 'is-valid' : 'is-invalid'")
						span.invalid-feedback No location provided
					.form-group
						.form-check
							input#route-spa(type="checkbox" v-model="app.hosting.target.routing" :true-value="false" :false-value="true")
							label(for="route-spa") Disable routing (SPA mode)
				.form-group(v-else)
					label Server address
					.row
						input.col(type="text" placeholder="localhost" v-model="app.hosting.target.hostname"
							:class="validation.hosting.target.hostname? 'is-valid' : 'is-invalid'")
						span.mx-1.text-muted.col-form-label :
						input.col(type="number" min="1" max="65535" placeholder="80" v-model="app.hosting.target.port"
							:class="validation.hosting.target.port? 'is-valid' : 'is-invalid'")

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
				label(for="analytics-url-input") Crash Course address
				input#analytics-url-input(type="text" v-model="app.analytics.url"
					:class="validation.analytics.url? 'is-valid' : 'is-invalid'")
			.form-group
				label(for="analytics-audience-key-input") Crash Course audience key
				input#analytics-key-input(type="text" v-model="app.analytics.audienceKey"
					:class="validation.analytics.audienceKey? 'is-valid' : 'is-invalid'")
			.form-group
				.form-check
					input#analytics-log-check(type="checkbox" v-model="app.analytics.loggingEnabled" :true-value="true" :false-value="false")
					label(for="analytics-log-check") Enable logging
			.form-group
				.form-check
					input#analytics-metrics-check(type="checkbox" v-model="app.analytics.metricsEnabled" :true-value="true" :false-value="false")
					label(for="analytics-metrics-check") Enable performance monitoring
			.telemetry(v-if="app.analytics?.loggingEnabled || app.analytics?.metricsEnabled")
				.form-group
					label(for="analytics-telemetry-key-input") Crash Course telemetry key
					input#analytics-key-input(type="text" v-model="app.analytics.telemetryKey"
						:class="validation.analytics.telemetryKey? 'is-valid' : 'is-invalid'")

			input.btn.btn-success(type="submit" value="Save app" :disabled="!validation.valid")
</template>


<script setup>
'use strict';

import {computed, onMounted, ref, toRaw, watch} from "vue";
import {validate} from "../../common/validate";
import FilePicker from "./FilePicker.vue";
import ProcessEditor from "./ProcessEditor.vue";
import ArrayEditor from "./ArrayEditor.vue";

const props = defineProps(['modelValue']);
const emit = defineEmits(['update:modelValue', 'close']);
const app = ref(structuredClone(toRaw(props.modelValue)));
const directory = ref(!!props.modelValue.hosting.target.directory.length);
const validation = computed(() => validate(app.value, directory.value));

function save() {
	!directory.value && (app.value.hosting.target.directory = '');

	if (!validate(app.value)) {
		return;
	}

	emit('update:modelValue', app.value);
	emit('close');
}
</script>
