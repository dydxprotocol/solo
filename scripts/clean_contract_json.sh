#!/bin/sh
set -e

npm run clean_contract_json
rm -rf ./build/contracts
mv ./build/test ./build/contracts
