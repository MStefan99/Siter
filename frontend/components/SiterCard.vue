<template lang="pug">
.card.app.mx-3
	h3 Siter
	.app-mask.border-bottom
		h4 Source
		.app-link
			b.domain siter
			span.text-muted .your-domain.tld:
			b.port {{secure? 443 : 80}}
			span.text-muted /
	.app-security.border-bottom
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

const secure = ref(null);
const analytics = ref(null);

fetch('/settings/network')
	.then(res => {
		if (res.ok) {
			return res.json();
		}
	}).then(s => secure.value = s.httpsRedirect);

fetch('/settings/analytics')
.then(res => {
	if (res.ok) {
		return res.json()
	}
}).then(a => analytics.value = a)
</script>

<style scoped>

</style>