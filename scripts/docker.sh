#!/bin/bash
set -e

cleanup ()
{
  kill -s SIGTERM $!
  exit 0
}

trap cleanup SIGINT SIGTERM

npm run docker_node &
PROC_ID=$!
sleep 5
npm run migrate -- --network=docker --reset

kill -TERM $PROC_ID
