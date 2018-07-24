./node_modules/.bin/tsc -p tsconfig.json
npx webpack --config webpack.config.js
npx webpack --config worker.webpack.config.js
npx serve dist
