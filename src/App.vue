<template lang="pug">
div#route-container.row
	div.route.mx-3
		h3 Siter route
		div.route-mask.border-bottom
			h4 URL mask
			a#route-siter.route-link(href='#')
				b.domain siter
				span.text-muted .your-domain.tld:
				b.port 80
				span.text-muted /
		div.route-security.border-bottom
			h4 Security
			p Secure: #[b= secure? 'yes' : 'no']
			if !secure
				p Please enable HTTPS in settings
		div.route-target.border-bottom
			h4 Target
			p
				b Siter web interface
	Route(v-for="route in routes" :routeData="route")
</template>


<script>
import Route from './Route.vue';
import * as notify from '../public/js/lib/notifications';

export default {
	components: {
		Route
	},
	name: 'App',
	data() {
		return {
			routes: []
		};
	},
	async beforeMount() {
		const res = await fetch('/api/v0.1/routes/')
				.catch(err => {
					// statusField.html('Server unavailable');
					// statusField.removeClass('alert-secondary');
					// statusField.addClass('alert-danger');
					notify.tell('Server unavailable',
							'Server refused to connect. Please check your firewall settings and ' +
							'restart Siter.',
							'danger');
				});

		// statusField.removeClass('alert-secondary');
		if (!res.ok) {
			// statusField.html('Server error');
			// statusField.addClass('alert-warning');
			await notify.tell('Server error',
					'Server is available but returned an invalid response. ' +
					'Please restart the server and check whether you are logged in.',
					'warning');
		} else {
			this.routes = await res.json();
			// statusField.html('Your server is running fine');
			// statusField.addClass('alert-success');
		}
	}
};
</script>
