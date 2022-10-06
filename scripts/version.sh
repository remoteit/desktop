#!/bin/sh

set -x

sed -i '' -e "s/\(define PKGVERSION \"\).*\"/\1$1\"/" installer.nsh
cd frontend
npm version $1
cd ../backend
npm version $1
cd ../
npm i --legacy-peer-deps
npm install
git add --all

set +x
