<template lang="pug">
.app.card
	h3 {{app.name}}
	.card-icon-container.float-right
		img.icon.edit-icon.clickable.mr-2(src="/img/pencil.svg" alt="Settings icon"
			@click="$emit('edit', app)")
		img.icon.edit-icon.clickable(src="/img/trash_can.svg" alt="Remove icon"
			@click="$emit('delete', app)")
	.app-mask.border-bottom
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
	.app-security.border-bottom
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
	.app-target.border-bottom
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

defineProps(['app']);
defineEmits(['edit', 'delete']);
</script>
