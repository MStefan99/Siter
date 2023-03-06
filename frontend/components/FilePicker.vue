<template lang="pug">
.file-picker
	.row.form-group
		input.col(type="text" placeholder="No file selected" :value="path" readonly)
		span.mx-1.text-muted.col-form-label
		button.btn.btn-success(type="button" @click="open = true; loadFiles()") Pick a file
	.popup-backdrop(v-if="open" @click.self="open = false")
		.popup.shadow-sm
			h2.my-2 Choose file
			.files
				.file.up.clickable(v-if="path.length" @click="goUp()") ..
				.file.clickable(v-for="file in files" :key="file" @click="goDown(file)") {{file}}
			.col.file-path {{path}}
			button.col.btn.btn-success(@click="open = false") Choose
</template>

<script setup>
import {ref, watch} from "vue";

const props = defineProps(['modelValue']);
const emit = defineEmits(['update:modelValue']);

const open = ref(false);
const path = ref(props.modelValue);
const files = ref([]);
watch(path, loadFiles);

function goUp() {
	path.value = path.value.replace(/[\/\\]([^\/\\]+)?$/, '');
	emit('update:modelValue', path.value);
}

function goDown(fileName) {
	path.value += fileName;
	emit('update:modelValue', path.value);
}

async function loadFiles() {
	const res = await fetch('/files' + (path.value ? '?path=' + path.value : ''));

	if (res.ok) {
		files.value = await res.json();
	} else {
		const err = await res.text();
		if (err === 'ENOTDIR') {
			open.value = false;
		}
	}
}
</script>

<style scoped>

</style>