const bulk = require('bulk-require')

module.exports = {
  'patch-git': bulk(__dirname, [
    // '!(app|message)/**/*.js'
    '!(node_modules|junk)/**/*.js'
  ])
}

