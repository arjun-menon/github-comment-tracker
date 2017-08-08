var path = require('path')

module.exports = {
  entry: './ghct-content.js',
  output: {
    filename: 'ghct-content.js',
    path: path.resolve('../..', 'dist')
  },
  module: {
    rules: [
      {
        test: /\.css$/,
        use: [
          'style-loader',
          'css-loader'
        ]
      }
    ]
  }
}
