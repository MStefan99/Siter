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
		p
			b Siter web interface
	//.app-analytics.border-bottom
		h4 Analytics
		p Analytics
</template>

<script setup>
import {ref} from "vue";

const secure = ref(null);

fetch('/settings/security')
	.then(res => {
		if (res.ok) {
			return res.json();
		}
	}).then(settings => secure.value = settings.httpsRedirect);
</script>

<style scoped>

</style>