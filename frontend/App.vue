<template lang="pug">
#apps
	h1 Dashboard
	h2 Status
	.alert.mx-3(:class="getServerClass()") {{getServerStatus()}}
	h2 Apps
	#app-container.row(@dragover.prevent @drop.prevent="appDrop($event)")
		SiterCard
		TransitionGroup(name="list")
			AppCard(v-for="app in apps" :key="app.id" :app="app" @edit="openApp = app" @delete="deleteApp(app)"
				draggable="true" @dragstart="appDrag($event, app)")
		Transition(name="popup")
			AppEditor(v-if="openApp" v-model="openApp" @update:modelValue="app => saveApp(app)" @close="openApp = null")
	button.btn-primary.ml-3(type="button" @click="openApp = defaultApp()") Add app
</template>


<script setup>
'use strict';

import notify from './public/js/notifications';

import AppCard from './components/AppCard.vue';
import AppEditor from './components/AppEditor.vue';
import {defaultApp} from './defaults';
import {onMounted, ref} from "vue";
import SiterCard from "./components/SiterCard.vue";

const serverStatus = ref('pending');
const apps = ref([]);
const openApp = ref(null);

function getServerStatus() {
	switch (serverStatus.value) {
		case 'pending':
			return 'Waiting for server...';
		case 'unavailable':
			return 'Server did not respond. Please check if the server is working.';
		case 'broken':
			return 'Server is available but received response was invalid. Please check server version.';
		case 'ok':
			return 'Your server is working fine!';
	}
}

function getServerClass() {
	switch (serverStatus.value) {
		case 'pending':
		case 'broken':
			return 'alert-warning';
		case 'unavailable':
			return 'alert-danger';
		case 'ok':
			return 'alert-success';
	}
}

function appDrag(e, app) {
	e.dataTransfer.setData('text/plain', app.id);
}

function appDrop(e) {
	const sourceID = e.dataTransfer.getData('text/plain');
	let targetID = e.target.closest('.app')?.getAttribute('data-app-id');

	if (!targetID) {
		for (const el of Array.from(document.getElementsByClassName('app')).reverse()) {
			const rect = el.getBoundingClientRect();
			if (e.clientY > rect.top && e.clientY < rect.bottom && e.clientX < rect.left) {
				targetID = el.getAttribute('data-app-id');
			}
		}
	}

	if (!targetID || targetID === sourceID) {
		return;
	}

	if (sourceID) {
		const sourceIndex = apps.value.findIndex(r => r.id === sourceID);
		const sourceApp = apps.value[sourceIndex];
		apps.value.splice(sourceIndex, 1);

		const targetIndex = apps.value.findIndex(r => r.id === targetID);
		apps.value.splice(targetIndex, 0, sourceApp);
	}

	fetch('/apps/reorder', {
		method: 'POST',
		headers: {
			'Content-Type': 'application/json'
		},
		body: JSON.stringify(apps.value.map(r => r.id))
	});
}


function saveApp(app) {
	const idx = apps.value.findIndex(r => r.id === app.id);

	// TODO: add error handling
	if (idx >= 0) {  // app already exists, editing
		fetch('/apps/' + app.id + '/', {
			method: 'PUT',
			headers: {
				'Content-Type': 'application/json'
			},
			body: JSON.stringify(app)
		})
			.then(res => res.json())
			.then(app => apps.value[idx] = app);
	} else {  // New app, adding
		fetch('/apps/', {
			method: 'POST',
			headers: {
				'Content-Type': 'application/json'
			},
			body: JSON.stringify(app)
		})
			.then(res => res.json())
			.then(app => apps.value.push(app));
	}
}

function deleteApp(app) {
	notify.ask('Are you sure to delete this app?',
		'Are you sure you want to delete the app ' +
		app.name + '? This action cannot be undone.',
		'warning'
	)
		.then(result => {
			if (result) {
				const idx = apps.value.findIndex(r => r.id === app.id);

				// TODO: add error handling
				if (idx >= 0) {
					fetch('/apps/' + app.id + '/', {
						method: 'DELETE'
					})
						.then(res => {
							if (res.ok) {
								apps.value.splice(idx, 1);
							}
						});
				}
			}
		});
}

onMounted(() => {
	fetch('/apps/')
		.catch(err => {
			serverStatus.value = 'unavailable';
			notify.tell('Server unavailable',
				'Server refused to connect. Please check your firewall settings and ' +
				'restart Siter.',
				'danger');
		}).then(res => {
		if (!res.ok) {
			serverStatus.value = 'broken';
			notify.tell('Server error',
				'Server is available but returned an invalid response. ' +
				'Please restart the server and check whether you are logged in.',
				'warning');
		} else {
			serverStatus.value = 'ok';
			return res.json();
		}
	}).then(a => apps.value = a);
});
</script>

<style></style>
