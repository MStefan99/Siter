<template lang="pug">
div.app.mx-3
	h3 app
	div.app-icon-container.float-right
		img.icon.edit-icon.clickable.mr-2(src="/img/pencil.svg" alt="Settings icon"
			@click="$emit('edit', appData.id)")
		img.icon.edit-icon.clickable(src="/img/trash_can.svg" alt="Remove icon"
			@click="deleteApp(appData)")
	div.app-mask.border-bottom
		h4 URL mask
		a.app-link(target="_blank"
			:href="(appData.hosting.source.secure? 'https://' : 'http://') + \
			appData.hosting.source.hostname + ':' + appData.hosting.source.port + '/' + \
			(appData.hosting.source.pathname || '')")
			b.domain {{appData.hosting.source.hostname}}
			span.text-muted :
			b.port {{appData.hosting.source.port}}
			span.text-muted /
			b.prefix {{appData.hosting.source.pathname}}
	div.app-security.border-bottom
		h4 Security
		div(v-if="appData.hosting.source.secure")
			p Secure:
				|
				|
				b Yes
		div(v-else)
			p Secure:
				|
				|
				b.text-danger No
		div(v-if="appData.hosting.source.secure")
			p Certificate file location:
			b.cert-file {{appData.hosting.source.cert}}
			p Key file location:
			b.key-file {{appData.hosting.source.key}}
	div.app-target.border-bottom
		h4 Hosting
		div(v-if="appData.hosting.target.directory?.length")
			p.directory Directory
			b {{appData.hosting.target.directory}}
		div(v-else)
			p.server Server
			a(:href="(appData.hosting.target.secure? 'https://': 'http://') + appData.hosting.target.hostname + ':' + appData.hosting.target.port + '/'")
				b.target-addr {{appData.hosting.target.hostname}}:{{appData.hosting.target.port}}
</template>


<script setup>
'use strict';

import notify from '../public/js/notifications.js';
import store from '../store.js';

defineProps(['appData']);
defineEmits(['edit']);

function deleteApp(app) {
	notify.ask('Are you sure to delete this app?',
		'Are you sure you want to delete the app ' +
		app.name + '? This action cannot be undone.',
		'warning'
	)
		.then(result => {
			if (result) {
				store.deleteApp(app);
			}
		});
}
</script>
