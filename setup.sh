#!/bin/bash

echo "Checking Node.js version..."
which node > /dev/null || (echo "Node.js is not installed. Please install version 12 or higher and try again"; exit 1)
NODE_VERSION=$(node -v)

if [[ ${NODE_VERSION:1:2} -lt 12 ]]; then
	echo "You are using an outdated version of Node. Please install version 12 or higher and try again"
	exit 1;
fi
echo "Node.js installed!"

echo "Installing dependencies..."
npm i
echo "Dependencies installed!"

echo "Converting sources..."
npx stylus -c ./frontend/public/style
npx pug-cli ./backend/views/standalone
echo "Sources converted!"

echo "Building..."
npm run build
echo "Build complete!"

echo "Installed successfully! Run \"node app.js\" to start Siter"
