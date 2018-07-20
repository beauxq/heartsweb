const path = require('path');

module.exports = {
  entry: './build/hearts.js',
  output: {
    filename: 'bundle.js',
    path: path.resolve(__dirname, 'dist')
  }
};
