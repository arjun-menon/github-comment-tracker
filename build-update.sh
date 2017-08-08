#!/usr/bin/env bash

./node_modules/eslint/bin/eslint.js --config .eslintrc.json --fix src/content/ghct-content.js
./node_modules/eslint/bin/eslint.js --config .eslintrc.json --fix src/background/ghct-background.js

./node_modules/eslint/bin/eslint.js --config .eslintrc.json --fix src/content/webpack.config.js
./node_modules/eslint/bin/eslint.js --config .eslintrc.json --fix src/background/webpack.config.js

mkdir -p dist

cd src

cd content
yarn build

cd ..

cd background
yarn build


