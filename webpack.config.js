var path = require('path');

module.exports = {
  entry: './src/content.js',
  output: {
    filename: 'ghct-content.js',
    path: path.resolve(__dirname, 'dist')
  }
};
