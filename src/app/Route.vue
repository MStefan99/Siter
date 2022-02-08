<template lang="pug">
div.route.mx-3(:data-route-id="routeData.id")
	h3 Route
	div.route-icon-container.float-right
		img.icon.edit-icon.clickable.mr-2(src="/img/pencil.svg" alt="Settings icon"
			@click="sharedState.startEditing(routeData)")
		img.icon.edit-icon.clickable(src="/img/trash_can.svg" alt="Remove icon"
			@click="deleteRoute(routeData)")
	div.route-mask.border-bottom
		h4 URL mask
		a.route-link(target="_blank" :id="'rlink-' + routeData.id"
			:href="(routeData.secure? 'https' : 'http') + '://' + \
			routeData.domain + ':' + routeData.port + '/' + (routeData.prefix || '')")
			b.domain {{routeData.domain}}
			span.text-muted :
			b.port {{routeData.port}}
			span.text-muted /
			b.prefix {{routeData.prefix}}
	div.route-security.border-bottom
		h4 Security
		p Secure: #[b {{routeData.secure? 'yes' : 'no'}}]
		div(v-if="routeData.secure")
			p Certificate file location:
			b.cert-file {{routeData.certFile}}
			p Key file location:
			b.key-file {{routeData.keyFile}}
	div.route-target.border-bottom
		h4 Target
		div(v-if="routeData.target === 'directory'")
			p.directory Directory
			b {{routeData.tDirectory}}
		div(v-if="routeData.target === 'server'")
			p.server Server
			a(:href="'http://' + routeData.tAddr + ':' + routeData.tPort + '/'")
				b.target-addr http://{{routeData.tAddr}}:{{routeData.tPort}}
</template>


<script>
'use strict';

import notify from '../../public/js/notifications.js';
import store from './store.js';


export default {
	name: 'Route',
	props: ['routeData'],
	data() {
		return {
			sharedState: store,
			privateState: {}
		};
	},
	methods: {
		deleteRoute(route) {
			notify.ask('Are you sure to delete this route?',
					'Are you sure you want to delete the route '
					+ (route.secure? 'https' : 'http') + '://'
					+ route.domain + ':' + route.port + '/' + (route.prefix || '')
					+ '? This action cannot be undone.',
					'warning'
			)
					.then(result => {
						if (result) {
							this.sharedState.deleteRoute(route);
						}
					});
		}
	}
};
</script>
