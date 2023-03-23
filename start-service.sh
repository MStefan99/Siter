#!/usr/bin/bash

# Setting work dir to the script dir

workDir=${0%/*}
cd "${workDir}" || exit

# Starting and installing the service

sed "s#_path_#$(pwd)/backend/index.js#" ./service.unit | sudo tee /etc/systemd/system/siter.service 1>/dev/null
sudo systemctl daemon-reload
sudo systemctl start siter && echo "Siter is running!"
sudo systemctl enable siter && echo "Siter is set to launch on boot!"
