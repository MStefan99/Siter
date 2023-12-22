<template lang="pug">
.file-picker
	.row
		input.col(type="text" placeholder="No file selected" :value="path" readonly)
		span.mx-1.text-muted.col-form-label
		button.btn.btn-success(type="button" @click="open = true") Pick a file
	Transition(name="popup")
		.popup-backdrop(v-if="open" @click.self="open = false")
			.popup.shadow-sm
				h2.my-2 Choose file
				p(v-if="prompt") {{prompt}}
				.files
					.file.up.clickable(v-if="path.length" @click="goUp()") ..
					.file.clickable(v-for="file in files" :key="file" @click="goDown(file)") {{file.name}}
				.col.file-path {{path}}
				button.col.btn.btn-success(type="button" @click="save()") Choose
</template>

<script setup>
'use strict';

import {ref, toRaw, watch} from "vue";
import notify from "../public/js/notifications";

const props = defineProps(['modelValue', 'prompt', 'dirMode']);
const emit = defineEmits(['update:modelValue']);

const open = ref(false);
const path = ref(structuredClone(toRaw(props.modelValue)));
const isDir = ref(true);
const files = ref([]);

watch(path, loadFiles);
watch(open, () => {
	if (open) {
		path.value = structuredClone(toRaw(props.modelValue));
		loadFiles();
	}
});

function dirname(path) {
	return path.replace(/[\/\\]([^\/\\]+)?$/, '');
}

function goUp() {
	path.value = dirname(path.value);
}

function goDown(file) {
	if (isDir.value && !(props.dirMode && !file.dir)) {
		path.value += file.name;
	}
}

function save() {
	open.value = false;
	emit('update:modelValue', path.value);
}

async function loadFiles() {
	const res = await fetch('/files' + (path.value ? '?path=' + path.value : ''));

	if (res.ok) {
		const data = await res.json();

		isDir.value = data.dir;
		files.value = data.files;
	} else {
		notify.tell('This file does not exist');
	}
}
</script>
