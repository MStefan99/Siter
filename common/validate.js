'use strict';

export function validate(app) {
	const result = {};

	result.domainValid = !!app.hosting.source.hostname?.match(/^[a-z0-9.\-]+$/);
	result.portValid = +app.hosting.source.port > 0 && +app.hosting.source.port < 65536;
	result.prefixValid = !!app.hosting.source.pathname?.match(/^[app-z0-9\/\-]*$/);

	result.certFileValid = !!app.hosting.source.cert?.length;
	result.keyFileValid = !!app.hosting.source.key?.length;

	result.targetDirValid = !!app.hosting.target.directory?.length;

	result.targetAddressValid = !!app.hosting.target.hostname?.match(/^[a-z0-9.\-]+$/);
	result.targetPortValid = +app.hosting.target.port > 0 && +app.hosting.target.port < 65536;

	result.valid =
		// Check URL mask
		result.domainValid && result.portValid && result.prefixValid
		// Check security if enabled
		&& (app.hosting.source.secure ? result.certFileValid && result.keyFileValid : true)
		// Check directory if enabled
		&& (app.hosting.target.directory?.length && result.targetDirValid
			// Check route if enabled
			|| !app.hosting.target.directory?.length && result.targetAddressValid && result.targetPortValid);
	
	return result;
}
