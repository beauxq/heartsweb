const path = require('path');
const TerserPlugin = require('terser-webpack-plugin');

module.exports = {
  entry: './build/hearts.js',
  output: {
    filename: 'bundle.js',
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
