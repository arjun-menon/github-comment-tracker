#!/usr/bin/env bash

mkdir -p dist

cd src

cd content
yarn build

cd ..

cd background
yarn build


