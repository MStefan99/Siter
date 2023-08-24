'use strict';

const os = require('os');
const si = require('systeminformation');
const {colors, resetConsole} = require("./log");


async function collect() {
	const metrics = {
		device: 'Siter',
		cpu: null,
		memUsed: null,
		memTotal: null,
		diskUsed: null,
		diskTotal: null,
		netUp: null,
		netDown: null
	};

	try {
		metrics.cpu = (await si.currentLoad()).currentLoad;
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
		console.error(`${colors[3]}[Siter]${resetConsole}`, e);
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
				console.warn(`${colors[3]}[Siter]${resetConsole}`, 'Failed to send metrics. Reason:', err.message);
			} else {
				console.warn(`${colors[3]}[Siter]${resetConsole}`, 'Failed to send metrics. Status: ', res.status);
			}
		}
	} catch (err) {
		console.warn(`${colors[3]}[Siter]${resetConsole}`, 'Failed to send metrics. Reason:', err.stack);
	}
}


module.exports = {
	collect,
	submit
};
