'use strict';

export default {
	id: null,
	route: {
		active: false,
		order: 0,
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
