'use strict';

export function defaultApp() {
	return {
		id: null,
		name: '',
		hosting: {
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
