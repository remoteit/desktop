#!/bin/sh

set -x

sed -i '' -e "s/\(define PKGVERSION \"\).*\"/\1$1\"/" installer.nsh
cd frontend
npm version $1
cd ../backend
npm version $1
git add --all

set +x
