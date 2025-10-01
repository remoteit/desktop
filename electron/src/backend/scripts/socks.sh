#!/bin/bash

# Assign arguments to variables
APP_NAME="$1"
PROXY_SERVER="$2"

# Execute the osascript to quit the app
osascript -e "quit app \"$APP_NAME\""

# Wait for 1 second
sleep 1

# Check if a proxy server is provided
if [ -z "$PROXY_SERVER" ]; then
    # Restart the app without proxy
    open -na "$APP_NAME"
else
    # Restart the app with proxy
    open -na "$APP_NAME" --args --proxy-server="$PROXY_SERVER"
fi
