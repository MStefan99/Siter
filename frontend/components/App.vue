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
			:href="(appData.route.source.secure? 'https://' : 'http://') + \
			appData.route.source.hostname + ':' + appData.route.source.port + '/' + \
			(appData.route.source.pathname || '')")
			b.domain {{appData.route.source.hostname}}
			span.text-muted :
			b.port {{appData.route.source.port}}
			span.text-muted /
			b.prefix {{appData.route.source.pathname}}
	div.app-security.border-bottom
		h4 Security
		div(v-if="appData.route.source.secure")
			p Secure:
				|
				|
				b Yes
		div(v-else)
			p Secure:
				|
				|
				b.text-danger No
		div(v-if="appData.route.source.secure")
			p Certificate file location:
			b.cert-file {{appData.route.source.cert}}
			p Key file location:
			b.key-file {{appData.route.source.key}}
	div.app-target.border-bottom
		h4 Target
		div(v-if="appData.route.target.directory?.length")
			p.directory Directory
			b {{appData.route.target.directory}}
		div(v-else)
			p.route route
			a(:href="(appData.route.target.secure? 'https://': 'http://') + appData.route.target.hostname + ':' + appData.route.target.port + '/'")
				b.target-addr {{appData.route.target.hostname}}:{{appData.route.target.port}}
</template>


<script setup>
'use strict';

import notify from '../public/js/notifications.js';
import store from '../store.js';

defineProps(['appData']);
defineEmits(['edit']);

function deleteApp(app) {
	notify.ask('Are you sure to delete this app?',
		'Are you sure you want to delete the app '
		+ (app.secure ? 'https' : 'http') + '://'
		+ app.domain + ':' + app.port + '/' + (app.prefix || '')
		+ '? This action cannot be undone.',
		'warning'
	)
		.then(result => {
			if (result) {
				store.deleteApp(app);
			}
		});
}
</script>
