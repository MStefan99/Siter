'use strict';

const childProcess = require('child_process');
const path = require('path');

const crashThreshold = 1000 * 60 * 10;
const initialDelay = 1000 * 10;
const maxDelay = 1000 * 60 * 5;

let restartDelay = 0;
let restartCount = 0;
let lastRestart = Date.now();

const clampMax = (val, max) => val > max ? max : val;

const restart = () => {
	const now = Date.now();
	if (now - lastRestart < crashThreshold && restartCount > 5) {
		restartDelay = restartDelay ? clampMax(restartDelay * 2, maxDelay) : initialDelay;
	} else if (now - lastRestart > crashThreshold) {
		restartDelay = restartCount = 0;
	}

	++restartCount;
	lastRestart = now;

	setTimeout(start, restartDelay);
};

function start() {
	const child = childProcess.fork(path.join(__dirname, 'siter.js'));
	child.on('exit', restart);
}

start();
