const nest = require('depnest')

module.exports = {
  'patch-git': {
    page: {
      index: require('./app/html/page/git'),
    }
    // styles: require('./styles/mcss')
  }
}

