#!/bin/sh

nmap -n -F $1 |grep -v "Starting" |grep -v "Host" |grep -v "shown" |grep -v "closed"
