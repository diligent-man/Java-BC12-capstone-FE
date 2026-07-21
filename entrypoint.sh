#!/usr/bin/env bash

# Set the heap limit to 4096MB (4GB)
export NODE_OPTIONS="--max-old-space-size=4096"

npm install -g npm@12.0.1

cd /my_app || exit
npm install
npx vite ./ --host 0.0.0.0 --port 3979
