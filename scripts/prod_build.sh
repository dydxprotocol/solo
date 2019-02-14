#!/bin/sh
set -e

npm run node -- -i 1313 -d -p 8545 -h 0.0.0.0 &
PROC_ID=$!
sleep 5
npm run migrate -- --network=docker --reset
kill -TERM $PROC_ID

npm run clean_contract_json
rm -rf ./build/contracts
rm -rf ./dist/js/build/contracts
cp -r ./build/published_contracts ./dist/js/build/published_contracts
