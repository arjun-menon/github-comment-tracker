#!/usr/bin/env bash

mkdir -p dist

cd src

cd content
yarn install
yarn build

cd ..

cd background
yarn install
yarn build

cd ..

cd ..

cp src/ghct-icon.png dist/
cp src/manifest.json dist/

