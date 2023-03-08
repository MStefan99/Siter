<template lang="pug">
.array-editor
	.row.form-group
		p.col Entries: {{modelValue.length}}
		span.mx-1.text-muted.col-form-label
		button.col.btn.btn-success(type="button" @click="open = true") Edit
	Transition(name="popup")
		.popup-backdrop(v-if="open" @click.self="open = false")
			.popup.shadow-sm
				h2.my-2 {{title ?? 'Entries'}}
				.entries
					.entry.card.p-2(v-for="(entry, i) in entries" :key="i")
						.float-right
							img.icon.edit-icon.clickable(src="/img/trash_can.svg" alt="Remove icon" @click="entries.splice(i, 1)")
						.form-group
							label Value
							input.col(type="text" v-model="entries[i]")
				button.col.btn.btn-outline-success(type="button" @click="entries.push('')") Add entry
				button.col.btn.btn-success(type="button" @click="save()") Save
</template>

<script setup>
'use strict';

import {ref, toRaw, watch} from "vue";

const props = defineProps(['modelValue', 'title']);
const emit = defineEmits(['update:modelValue']);

const open = ref(false);
const entries = ref([]);
assignEntries();

watch(open, () => open && assignEntries());

function assignEntries() {
	entries.value = structuredClone(toRaw(props.modelValue));
}

function save() {
	open.value = false;
	emit('update:modelValue', entries.value);
}
</script>

<style scoped>
</style>
