#!/bin/sh
set -e

npm run node -- -i 1313 -d -k=petersburg -p 8545 -h 0.0.0.0 &
PROC_ID=$!
sleep 5
npm run migrate -- --network=docker --reset
kill -TERM $PROC_ID

cp -r ./build/published_contracts ./dist/js/build/published_contracts
