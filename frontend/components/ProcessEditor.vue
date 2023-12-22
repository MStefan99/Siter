<template lang="pug">
.process-editor
	.row.form-group
		p.col Processes: {{modelValue.length}}
		span.mx-1.text-muted.col-form-label
		button.col.btn.btn-success(type="button" @click="open = true") Edit
	Transition(name="popup")
		.popup-backdrop(v-if="open" @click.self="open = false")
			.popup.shadow-sm
				h2.my-2 Processes
				.processes
					.process.card.p-2(v-for="(process, i) in processes")
						p.bold Process
						.float-right
							img.icon.edit-icon.clickable(src="/img/trash_can.svg" alt="Remove icon" @click="processes.splice(i, 1)")
						.form-group
							label(for="process-cmd") Executable
							input#process-cmd(type="text" v-model="process.cmd" placeholder="node")
						.form-group
							label File
							FilePicker(v-model="process.path" prompt="Choose a file to run")
						.form-group
							label(for="process-flags") Flags
							input#process-flags(type="text" v-model="process.flags" placeholder="--verbose")
						.form-group
							label Environment variables
							KeyValueEditor(v-model="process.env" title="Environment variables")
				button.col.btn.btn-outline-success(type="button" @click="processes.push(defaultProcess())") Add process
				button.col.btn.btn-success(type="button" @click="save()") Save
</template>

<script setup>
'use strict';

import {ref, toRaw, watch} from "vue";
import FilePicker from "./FilePicker.vue";
import KeyValueEditor from "./KeyValueEditor.vue";
import {defaultProcess} from "../defaults";

const props = defineProps(['modelValue']);
const emit = defineEmits(['update:modelValue']);

const open = ref(false);
const processes = ref({});

watch(open, () => open && assignProcesses());

function assignProcesses() {
	processes.value = structuredClone(toRaw(props.modelValue));
}

function save() {
	open.value = false;
	emit('update:modelValue', processes.value);
}
</script>
