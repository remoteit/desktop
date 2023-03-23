#!/bin/sh

set -x

cd frontend
npm version $1
cd ../backend
npm version $1
cd ../
npm i --legacy-peer-deps
npm install
git add --all

set +x
