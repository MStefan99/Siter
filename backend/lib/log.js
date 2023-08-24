'use strict';

const logCache = [];
let timeout = null;

const colors = ['\u001b[38;5;62m', '\u001b[38;5;29m', '\u001b[38;5;178m', '\u001b[38;5;166m', '\u001b[38;5;161m'];
const resetConsole = '\u001b[0m';

async function submitLog(url, key, message, level) {
	try {
		const res = await fetch(url + '/telemetry/logs', {
			method: 'POST',
			headers: {'Content-Type': 'application/json', 'Telemetry-Key': key},
			body: JSON.stringify({level, message: message.replace(/\033.*?m/g, '')})
		});

		if (!res.ok) {
			if (res.headers.get('Content-Type').match('application/json')) {
				const err = await res.json();
				console.log(`${colors[3]}[Siter]${resetConsole}`, 'Failed to send log:', message, 'Reason:', err.message);
			} else {
				console.log(`${colors[3]}[Siter]${resetConsole}`, 'Failed to send log:', message, 'Status: ', res.status);
			}
		}
	} catch (err) {
		console.log(`${colors[3]}[Siter]${resetConsole}`, 'Failed to send log:', message, 'Reason:', err.stack);
	}
}

function cacheAndSubmit(url, key, message, level) {
	logCache.push({url, key, message, level});

	const submit = async () => {
		const log = logCache.shift();

		timeout = true;
		await submitLog(log.url, log.key, log.message, log.level).then(() => {
			if (logCache.length) {
				timeout = setTimeout(submit, 16);
			} else {
				timeout = null;
			}
		});
	};

	return timeout ? Promise.resolve() : submit();
}

async function sendLog(url, key, message, level) {
	if (level === 0) {
		return cacheAndSubmit(url, key, message, level);
	} else {
		return submitLog(url, key, message, level);
	}
}


module.exports = {sendLog, colors, resetConsole};
