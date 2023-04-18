'use strict';

const os = require('os');
const si = require('systeminformation');


async function collect() {
	const metrics = {
		device: 'Test device',
		cpu: null,
		memUsed: null,
		memTotal: null,
		diskUsed: null,
		diskTotal: null,
		netUp: null,
		netDown: null
	};

	if (process.platform === 'darwin') {
		try {
			metrics.cpu = os.loadavg()[0];
			const mem = await si.mem();
			metrics.memUsed = mem.active;
			metrics.memTotal = mem.total;
			const disk = (await si.fsSize()).find(fs => fs.mount === '/System/Volumes/Data');
			metrics.diskUsed = disk.used;
			metrics.diskTotal = disk.size;
			const net = (await si.networkStats())[0];
			metrics.netUp = net.tx_sec;
			metrics.netDown = net.rx_sec;
		} catch (e) {
			console.error(e);
		}
	}

	return metrics;
}

async function submit(metrics, url, key) {
	try {
		const res = await fetch(url + '/telemetry/metrics', {
			method: 'POST',
			headers: {
				'Content-Type': 'application/json',
				'Telemetry-Key': key
			},
			body: JSON.stringify(metrics)
		});
		if (!res.ok) {
			if (res.headers.get('Content-Type').match('application/json')) {
				const err = await res.json();
				console.warn('Failed to send metrics. Reason:', err.message);
			} else {
				console.warn('Failed to send metrics. Status: ', res.status);
			}
		}
	} catch (err) {
		console.warn('Failed to send metrics. Reason:', err.stack);
	}
}


module.exports = {
	collect,
	submit
};
