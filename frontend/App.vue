<template lang="pug">
#apps
	h1 Dashboard
	h2 Status
	div.alert.mx-3(:class="getServerClass()") {{getServerStatus()}}
	h2 apps
	div#app-container.row(@dragover.prevent @drop.prevent="appDrop($event)")
		div.app.mx-3
			h3 Siter app
			div.app-mask.border-bottom
				h4 URL mask
				a.app-link(href="#")
					b.domain siter
					span.text-muted .your-domain.tld:
					b.port 80
					span.text-muted /
			div.app-security.border-bottom
				h4 Security
				div(v-if="secure")
					p Secure:
						|
						|
						b Yes
				div(v-else)
					p Secure:
						|
						|
						b.text-danger No
					div Please enable HTTPS redirect in settings
			div.app-target.border-bottom
				h4 Target
				p
					b Siter web interface
		TransitionGroup(name="list")
			App(v-for="app in store.apps" :key="app.id" :appData="app" @edit="openApp = app"
				draggable="true" @dragstart="appDrag($event, app)")
		Transition(name="popup")
			AppEditor(v-if="openApp" :app="openApp" @update="r => app = r" @close="openApp = null")
	button.btn-primary.ml-3(type="button" @click="openApp = app") Add app
</template>


<script setup>
'use strict';

import notify from './public/js/notifications';

import store from './store.js';
import App from './components/App.vue';
import AppEditor from './components/AppEditor.vue';
import app from './app';
import {onMounted, ref} from "vue";

const serverStatus = ref('pending');
const secure = ref(null);
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
		const sourceIndex = store.apps.findIndex(r => r.id === sourceID);
		const sourceApp = store.apps[sourceIndex];
		store.apps.splice(sourceIndex, 1);

		const targetIndex = store.apps.findIndex(r => r.id === targetID);
		store.apps.splice(targetIndex, 0, sourceApp);
	}

	fetch('/apps/reorder', {
		method: 'POST',
		headers: {
			'Content-Type': 'application/json'
		},
		body: JSON.stringify(store.apps.map(r => r.id))
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
	}).then(apps => store.apps = apps);

	fetch('/security')
		.then(res => {
			if (res.ok) {
				return res.json();
			}
		}).then(settings => secure.value = settings.httpsRedirect);
});
</script>

<style></style>
