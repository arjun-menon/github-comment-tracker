var path = require('path')

module.exports = {
  entry: './ghct-background.js',
  output: {
    filename: 'ghct-background.js',
    path: path.resolve('../..', 'dist')
  }
}
