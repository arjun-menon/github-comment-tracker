#!/usr/bin/env bash

cd src

cd content
yarn install
yarn build

cd ..

cd background
yarn install
yarn build

