const path = require('path');

module.exports = {
  entry: './build/worker.js',
  output: {
    filename: 'workerbundle.js',
    path: path.resolve(__dirname, 'dist')
  },
  mode: "development"
};
