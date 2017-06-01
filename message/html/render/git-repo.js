const nest = require('depnest')
const { h, Value, watch } = require('mutant')
const pull = require('pull-stream')

const GitRepo = require('pull-git-repo')
const ssbGit = require('ssb-git-repo')
const asyncMemo = require('asyncmemo')
const LRUCache = require('lrucache')

const u = require('../../../lib/util')
const markdown = require('../../../lib/markdown')

exports.gives = nest('message.html.render')

exports.needs = nest({
  'git.obs.repoName': 'first',
  'sbot.obs.connection': 'first'
})

exports.create = function (api) {
  return nest('message.html.render', render)
    
  function render (msg, { pageId } = {}) {
    var c = msg.value.content
    if (c.type !== 'git-repo') return 
    if (!pageId) return 

    var readme = Value(h('div', 'Loading!'))
    const path = [ '', 'master' ] // TODO ...check back with git ssb web

////
    const ssb = api.sbot.obs.connection()

    const getMsg = asyncMemo({ cache: new LRUCache(100) }, getMsgRaw)
    const getRepo = asyncMemo({ cache: new LRUCache(32) }, (id, cb) => {
      getMsg(id, (err, msg) => {
        if (err) return cb(err)

        ssbGit.getRepo(ssb, msg, { live: true }, cb)
      })
    })

    function getMsgRaw (key, cb) {
      ssb.get(key, (err, value) => {
        if (err) return cb(err)
        u.decryptMessage(ssb, { key, value }, cb)
      })
    }

    getRepo(msg.key, (err, repo) => {
      if (err) return cb(null, self.serveError(req, err)) // TODO serveError

      const rev = path[1]
      repo = GitRepo(repo)

      repo.getLatestAvailableRev(rev, 10e3, (err, revGot, numSkipped) => {
        if (err) return obs.set(printError(err))
        
        renderRepoReadme(repo, revGot, [], readme)
        // renderRepoReadme(repo, revGot, path, readme)
      })
    })

    return h('Repo', [
      h('h1', api.git.obs.repoName(msg.key)),
      h('pre', `ssb://${msg.key}`),
      h('section', readme)
    ])
  }
}

function renderRepoReadme (repo, rev, path, obs) {
  pull(
    repo.readDir(rev, path),
    pull.filter(file => /readme(\.|$)/i.test(file.name)),
    pull.take(1),
    pull.collect((err, files) => {
      if (err) return obs.set(printError(err))

      var file = files[0]
      if (!file) return obs.set(h('p', 'No Readme/ file'))

      repo.getObjectFromAny(file.id, (err, obj) => {
        if (err) return obs.set(printError(err))

        renderObjectData(obj, file.name, repo, rev, path, obs)
      })
    })
  )
}

function renderObjectData (obj, filename, repo, rev, path, obs) {
  var ext = u.getExtension(filename)

  u.readObjectString(obj, (err, buf) => {
    buf = buf.toString('utf8')
    if (err) return obs.set(printError(err))

    const content = (ext == 'md' || ext == 'markdown')
      // ? h('pre', buf)
      ? markdown(buf, { repo, rev, path })
      : buf.length > 1000000 ? ''
      : renderCodeTable(buf, ext)

    obs.set(h('div', { innerHTML: content }))
  })
}

function printError (err) {
  return h('pre', JSON.stringify(err, null, 2))
}

