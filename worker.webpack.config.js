const path = require('path');
const TerserPlugin = require('terser-webpack-plugin');

module.exports = {
  entry: './build/worker.js',
  output: {
    filename: 'workerbundle.js',
    path: path.resolve(__dirname, 'dist')
  },
  optimization: {
    minimize: true,
    minimizer: [
      new TerserPlugin({
        terserOptions: { 
          compress: { 
            pure_funcs: [
              'console.log', 
              'console.info', 
              'console.debug'
            ] 
          }
        }
      })
    ],
  },
  mode: "development"
};
