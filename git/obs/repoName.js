const nest = require('depnest')
const { Value } = require('mutant')
var getAvatar = require('ssb-avatar')

exports.gives = nest('git.obs.repoName')

exports.needs = nest({
  'keys.sync.id': 'first',
  sbot: {
    'pull.links': 'first',
    'async.get': 'first'
  }
})

exports.create = function (api) {
  return nest('git.obs.repoName', repoName)

  // TODO - build cache?

  function repoName (id) {
    var name = Value(id.substr(0, 10) + '…')

    getAvatar(
      {
        links: api.sbot.pull.links,
        get: api.sbot.async.get
      },
      api.keys.sync.id(), 
      id,
      (err, avatar) => name.set(avatar ? avatar.name : '')
    )

    return name
  }
}

