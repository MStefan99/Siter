<template lang="pug">
.card.app.mx-3
	h3 Siter
	.app-mask.border-bottom
		h4 Source
		.app-link.mb-2(v-if="!net.httpsRedirect")
			b.domain siter
			span.text-muted .your-domain.tld:
			b.port {{net.httpPort}}
			span.text-muted /
		.app-link.mb-2(v-if="net.httpsEnabled" )
			b.domain siter
			span.text-muted .your-domain.tld:
			b.port {{net.httpsPort}}
			span.text-muted /
	.app-security.border-bottom
		h4 Security
		div(v-if="net.httpsRedirect")
			p Secure:
				|
				|
				b Yes
		div(v-else)
			p Secure:
				|
				|
				b.text-danger No
			p Please enable HTTPS redirect in settings
	.app-target.border-bottom
		h4 Target
		p Siter web interface
	.app-analytics.border-bottom
		h4 Analytics
		p Analytics {{analytics?.enabled ? 'enabled' : 'disabled'}}
		p(v-if="analytics?.enabled") Crash Course URL:
			|
			|
			b {{analytics?.url}}
</template>

<script setup>
import {ref} from "vue";

const net = ref({});
const analytics = ref({});

fetch('/settings/network')
	.then(res => {
		if (res.ok) {
			return res.json();
		}
	}).then(s => net.value = s);

fetch('/settings/analytics')
.then(res => {
	if (res.ok) {
		return res.json()
	}
}).then(a => analytics.value = a)
</script>
