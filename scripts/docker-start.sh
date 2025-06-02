#!/bin/bash

# Check if dfx is running by checking if port 8080 is in use
if nc -z localhost 8080 2>/dev/null; then
    echo "dfx is running, stopping it..."
    dfx stop
    # Give it a moment to fully stop
    sleep 2
fi

echo "Starting dfx..."
dfx start