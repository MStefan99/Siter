<template lang="pug">
div.app.mx-3
	h3 app
	div.app-icon-container.float-right
		img.icon.edit-icon.clickable.mr-2(src="/img/pencil.svg" alt="Settings icon"
			@click="$emit('edit', appData.id)")
		img.icon.edit-icon.clickable(src="/img/trash_can.svg" alt="Remove icon"
			@click="deleteapp(appData)")
	div.app-mask.border-bottom
		h4 URL mask
		a.app-link(target="_blank"
			:href="(appData.server.source.secure? 'https://' : 'http://') + \
			appData.server.source.hostname + ':' + appData.server.source.port + '/' + \
			(appData.server.source.pathname || '')")
			b.domain {{appData.server.source.hostname}}
			span.text-muted :
			b.port {{appData.server.source.port}}
			span.text-muted /
			b.prefix {{appData.server.source.pathname}}
	div.app-security.border-bottom
		h4 Security
		div(v-if="appData.server.source.secure")
			p Secure:
				|
				|
				b Yes
		div(v-else)
			p Secure:
				|
				|
				b.text-danger No
		div(v-if="appData.server.source.secure")
			p Certificate file location:
			b.cert-file {{appData.server.source.cert}}
			p Key file location:
			b.key-file {{appData.server.source.key}}
	div.app-target.border-bottom
		h4 Target
		div(v-if="appData.server.target.directory?.length")
			p.directory Directory
			b {{appData.server.target.directory}}
		div(v-else)
			p.server Server
			a(:href="(appData.server.target.secure? 'https://': 'http://') + appData.server.target.hostname + ':' + appData.server.target.port + '/'")
				b.target-addr {{appData.server.target.hostname}}:{{appData.server.target.port}}
</template>


<script setup>
'use strict';

import notify from '../../../public/js/notifications.js';
import store from '../store.js';

defineProps(['appData']);
defineEmits(['edit']);

function deleteapp(app) {
	notify.ask('Are you sure to delete this app?',
		'Are you sure you want to delete the app '
		+ (app.secure ? 'https' : 'http') + '://'
		+ app.domain + ':' + app.port + '/' + (app.prefix || '')
		+ '? This action cannot be undone.',
		'warning'
	)
		.then(result => {
			if (result) {
				store.deleteapp(app);
			}
		});
}
</script>
