<template lang="pug">
div.app.mx-3
	h3 {{app.name}}
	div.app-icon-container.float-right
		img.icon.edit-icon.clickable.mr-2(src="/img/pencil.svg" alt="Settings icon"
			@click="$emit('edit', app.id)")
		img.icon.edit-icon.clickable(src="/img/trash_can.svg" alt="Remove icon"
			@click="deleteApp(app)")
	div.app-mask.border-bottom
		h4 URL mask
		a.app-link(target="_blank"
			:href="(app.hosting.source.secure? 'https://' : 'http://') + \
			app.hosting.source.hostname + ':' + app.hosting.source.port + '/' + \
			(app.hosting.source.pathname || '')")
			b.domain {{app.hosting.source.hostname}}
			span.text-muted :
			b.port {{app.hosting.source.port}}
			span.text-muted /
			b.prefix {{app.hosting.source.pathname}}
	div.app-security.border-bottom
		h4 Security
		div(v-if="app.hosting.source.secure")
			p Secure:
				|
				|
				b Yes
		div(v-else)
			p Secure:
				|
				|
				b.text-danger No
		div(v-if="app.hosting.source.secure")
			p Certificate file location:
			b.cert-file {{app.hosting.source.cert}}
			p Key file location:
			b.key-file {{app.hosting.source.key}}
	div.app-target.border-bottom
		h4 Hosting
		div(v-if="app.hosting.target.directory?.length")
			p.directory Directory
			b {{app.hosting.target.directory}}
		div(v-else)
			p.server Server
			a(:href="(app.hosting.target.secure? 'https://': 'http://') + app.hosting.target.hostname + ':' + app.hosting.target.port + '/'")
				b.target-addr {{app.hosting.target.hostname}}:{{app.hosting.target.port}}
</template>


<script setup>
'use strict';

import notify from '../public/js/notifications.js';
import store from '../store.js';

defineProps(['app']);
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
