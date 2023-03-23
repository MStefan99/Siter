#!/usr/bin/bash

# Stopping and uninstalling the service

sudo systemctl stop siter && echo "Siter will no longer start on boot"
sudo systemctl disable siter && echo "Siter stopped"
sudo rm /etc/systemd/system/siter.service
