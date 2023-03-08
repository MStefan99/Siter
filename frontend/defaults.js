'use strict';

export function defaultApp() {
	return {
		id: null,
		name: '',
		hosting: {
			order: 0,
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
				routing: true,
				directory: ''
			},
			cors: {
				origins: []
			}
		},
		pm: {
			active: false,
			processes: []
		},
		analytics: {
			active: false,
			url: '',
			key: ''
		}
	}
}

export function defaultProcess() {
	return {
		cmd: '',
		path: '',
		flags: '',
		env: {}
	}
}
