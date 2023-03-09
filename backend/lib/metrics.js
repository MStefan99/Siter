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
		await fetch(url + '/telemetry/metrics', {
			method: 'POST',
			headers: {
				'Content-Type': 'application/json',
				'Telemetry-Key': key
			},
			body: JSON.stringify(metrics)
		});
	} catch (e) {
		console.error(e);
	}
}


module.exports = {
	collect,
	submit
};
