<template lang="pug">
.process-editor
	.row.form-group
		p {{processes.length}} processes added.
		span.mx-1.text-muted.col-form-label
		button.btn.btn-success(type="button" @click="open = true") Edit
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
			button.col.btn.btn-outline-success(type="button" @click="processes.push(defaultProcess())") Add process
			button.col.btn.btn-success(type="button" @click="save()") Save
</template>

<script setup>
import {ref} from "vue";
import FilePicker from "./FilePicker.vue";
import {defaultProcess} from "../defaults";

const props = defineProps(['modelValue']);
const emit = defineEmits(['update:modelValue']);

const processes = ref(props.modelValue);
const open = ref(false);

function save() {
	open.value = false;
	emit('update:modelValue', processes.value);
}
</script>

<style scoped>
</style>
