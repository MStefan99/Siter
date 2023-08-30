<template lang="pug">
.app.card(:data-app-id="app.id")
	h3 {{app.name}}
	.card-icon-container.float-right
		img.icon.edit-icon.clickable.mr-2(v-if="app.pm.enabled" src="/img/restart.svg" alt="Settings icon"
			@click="$emit('restart')")
		img.icon.edit-icon.clickable.mr-2(src="/img/pencil.svg" alt="Settings icon"
			@click="$emit('edit', app)")
		img.icon.edit-icon.clickable(src="/img/trash_can.svg" alt="Remove icon"
			@click="$emit('delete')")
	.app-mask.border-bottom
		h4 Source
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
			p.mb-2 Certificate file location:
			b.cert-file {{app.hosting.source.cert}}
			p.mb-2 Key file location:
			b.key-file {{app.hosting.source.key}}
			div(v-if="app.hosting.source.redirectPort" )
				p.mb-2 Redirect port:
					|
					|
					b {{app.hosting.source.redirectPort}}
	.app-target.border-bottom
		h4 Target
		div(v-if="app.hosting.target.directory?.length")
			p.directory.mb-2 Directory
			b {{app.hosting.target.directory}}
		div(v-else)
			p.server.mb-2 Server
			a(:href="(app.hosting.target.secure? 'https://': 'http://') + app.hosting.target.hostname + ':' + app.hosting.target.port + '/'"
				target="_blank")
				b.target-addr {{app.hosting.target.hostname}}:{{app.hosting.target.port}}
	.app-pm.border-bottom
		h4 Process manager
		p Processes:
			|
			|
			b {{app.pm.processes.length}}
	.app-analytics.border-bottom
		h4 Analytics
		p Performance monitoring:
			|
			|
			b {{app.analytics.metricsEnabled ? 'enabled' : 'disabled'}}
		p Logging:
			|
			|
			b {{app.analytics.loggingEnabled ? 'enabled' : 'disabled'}}
		p.mb-2(v-if="app.analytics.metricsEnabled || app.analytics.loggingEnabled") Crash Course URL:
			|
			|
			b {{app.analytics.url}}
</template>


<script setup>
'use strict';

defineProps(['app']);
defineEmits(['restart', 'edit', 'delete']);
</script>

<style>
p {
	margin-bottom: 0;
}

.border-bottom {
	padding-bottom: 1em;
}
</style>
