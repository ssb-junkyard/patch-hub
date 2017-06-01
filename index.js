const bulk = require('bulk-require')

module.exports = {
  'patch-hub': bulk(__dirname, [
    'app/**/*.js',
    'git/**/*.js',
    'message/**/*.js',
    'styles/**/*.js'
  ])
}

