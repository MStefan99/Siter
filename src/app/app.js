'use strict';

export default {
	id: null,
	order: 0,
	server: {
		active: false,
		source: {
			hostname: '',
			port: 80,
			pathname: '',
			secure: false,
			cert: '',
			key: ''
		},
		target: {
			hostname: '',
			port: 80,
			secure: false,
			directory: ''
		}
	},
	process: {
		active: false,
		targets: []
	},
	analytics: {
		active: false,
		key: ''
	}
}
