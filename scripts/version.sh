#!/bin/sh

set -x

sed -i '' -e "s/\(define PKGVERSION \"\).*\"/\1$1\"/" installer.nsh
cd frontend
npm version $1
cd ../backend
npm version $1
npm i --legacy-peer-deps
git add --all

set +x
