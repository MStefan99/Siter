#!/bin/sh

curl -sL https://deb.nodesource.com/setup_12.x | sudo -E bash - &&
sudo apt-get update &&
sudo apt-get install nodejs -y &&
npm install
