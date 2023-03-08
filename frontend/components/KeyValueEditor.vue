<template lang="pug">
.kv-editor
	.row.form-group
		p {{entries.length}} entries added.
		span.mx-1.text-muted.col-form-label
		button.btn.btn-success(type="button" @click="open = true") Edit
	.popup-backdrop(v-if="open" @click.self="open = false")
		.popup.shadow-sm
			h2.my-2 {{title ?? 'Entries'}}
			.entries
				.entry.card.p-2(v-for="(entry, i) in entries" :key="i")
					.float-right
						img.icon.edit-icon.clickable(src="/img/trash_can.svg" alt="Remove icon" @click="entries.splice(i, 1)")
					.form-group
						label Key
						input.col(type="text" v-model="entry.key")
					.form-group
						label Value
						input.col(type="text" v-model="entry.value")
			button.col.btn.btn-outline-success(type="button" @click="entries.push({key: '', value:''})") Add entry
			button.col.btn.btn-success(type="button" @click="save()") Save
</template>

<script setup>
import {ref, watch} from "vue";

const props = defineProps(['modelValue', 'title']);
const emit = defineEmits(['update:modelValue']);

const open = ref(false);
const entries = ref([]);
assignEntries();

watch(open, () => open && assignEntries());

function assignEntries() {
	entries.value = Object.keys(props.modelValue).map(k => {
		return {key: k, value: props.modelValue[k]}
	})
}

function save() {
	open.value = false;
	emit('update:modelValue', entries.value.reduce((obj, el) => {obj[el.key] = el.value; return obj}, {}));
}
</script>

<style scoped>
</style>
