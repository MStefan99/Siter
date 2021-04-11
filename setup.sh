#!/bin/sh

curl -sL https://deb.nodesource.com/setup_12.x | sudo -E bash -
sudo apt-get update
sudo apt-get install nodejs sqlite3 -y
npm install

cat ./database/ddl/*.sql | sqlite3 ./database/db.sqlite
echo Setup done! Please run \"node ./app.js\" to get started.
