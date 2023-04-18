'use strict';

function validate(app, directoryMode) {
	if (directoryMode === undefined) {
		directoryMode = !!app.hosting.target.directory;
	}

	const validation = {
		hosting: {
			source: {
				hostname: !!app.hosting.source.hostname?.match(/^[a-z0-9.\-]+$/),
				port: +app.hosting.source.port > 0 && +app.hosting.source.port < 65536,
				pathname: !!app.hosting.source.pathname?.match(/^[a-z0-9\/\-]*$/),
				cert: !app.hosting.source.secure || app.hosting.source.cert?.length,
				key: !app.hosting.source.secure || app.hosting.source.key?.length
			},
			target: {
				directory: directoryMode,
				hostname: directoryMode || !!app.hosting.target.hostname?.match(/^[a-z0-9.\-]+$/),
				port: directoryMode || (+app.hosting.target.port > 0 && +app.hosting.target.port < 65536)
			},
		},
		pm: app.pm.processes.map(process => {
			return {
				cmd: !!process.cmd.length,
				path: !!process.path.length
			}
		}),
		analytics: {
			url: (!app.analytics.loggingEnabled && !app.analytics.metricsEnabled && !app.analytics.audienceKey.length) || !!app.analytics.url.length,
			telemetryKey: (!app.analytics.loggingEnabled && !app.analytics.metricsEnabled) || !!app.analytics.telemetryKey.length,
			audienceKey: !!app.analytics.audienceKey.length? !!app.analytics.url.length : true
		}
	};

	validation.valid = (!app.hosting.enabled || (
			validation.hosting.source.hostname &&
			validation.hosting.source.port &&
			validation.hosting.source.pathname &&
			validation.hosting.source.cert &&
			validation.hosting.source.key &&
			(validation.hosting.target.directory || (
				validation.hosting.target.hostname &&
				validation.hosting.target.port)))) &&
		(!app.pm.enabled || validation.pm.every(p => p.cmd && p.path)) &&
			validation.analytics.url &&
			validation.analytics.telemetryKey &&
			validation.analytics.audienceKey;

	return validation;
}

module.exports = {validate};
