const nest = require('depnest')
const { h } = require('mutant')
const pull = require('pull-stream')

exports.gives = nest('message.html.render')

// exports.needs = nest({
// })

exports.create = function (api) {
  return nest('message.html.render', render)
    
  function render (msg) {
    var c = msg.value.content
    if (c.type !== 'git-repo') return 

    return // TODO : refactor to mutant standard ///////////////////

    var branchesT, tagsT, openIssuesT, closedIssuesT, openPRsT, closedPRsT
    var forksT
    var div = h('div',
      h('p', h('code', 'ssb://' + msg.key)),
      h('div.git-table-wrapper', {style: {'max-height': '12em'}},
        h('table',
          branchesT = tableRows(h('tr',
            h('th', 'branch'),
            h('th', 'commit'),
            h('th', 'last update'))),
          tagsT = tableRows(h('tr',
            h('th', 'tag'),
            h('th', 'commit'),
            h('th', 'last update'))))),
      h('div.git-table-wrapper', {style: {'max-height': '16em'}},
        h('table',
          openIssuesT = tableRows(h('tr',
            h('th', 'open issues'))),
          closedIssuesT = tableRows(h('tr',
            h('th', 'closed issues'))))),
      h('div.git-table-wrapper', {style: {'max-height': '16em'}},
        h('table',
          openPRsT = tableRows(h('tr',
            h('th', 'open pull requests'))),
          closedPRsT = tableRows(h('tr',
            h('th', 'closed pull requests'))))),
      h('div.git-table-wrapper',
        h('table',
          forksT = tableRows(h('tr',
            h('th', 'forks'))))),
      h('div', h('a', {href: '#', onclick: function (e) {
        e.preventDefault()
        this.parentNode.replaceChild(issueForm(msg), this)
      }}, 'New Issue…')),
      newPullRequestButton.call(this, msg)
    )

    pull(getRefs(msg), pull.drain(function (ref) {
      var name = ref.realname || ref.name
      var author = ref.link && ref.link.value.author
      var parts = /^refs\/(heads|tags)\/(.*)$/.exec(name) || []
      var shortName = parts[2]
      var t
      if(parts[1] === 'heads') t = branchesT
      else if(parts[1] === 'tags') t = tagsT
      if(t) t.append(h('tr',
        h('td', shortName,
          ref.conflict ? [
            h('br'),
            h('a', {href: '#'+author}, api.avatar_name(author))
          ] : ''),
        h('td', h('code', ref.hash)),
        h('td', messageTimestampLink(ref.link))))
    }, function (err) {
      if(err) console.error(err)
    }))

    // list issues and pull requests
    pull(
      api.sbot_links({
        reverse: true,
        dest: msg.key,
        rel: 'project',
        values: true
      }),
      paramap(function (link, cb) {
        getIssueState(link.key, function (err, state) {
          if(err) return cb(err)
          link.state = state
          cb(null, link)
        })
      }),
      pull.drain(function (link) {
        var c = link.value.content
        var title = c.title || (c.text ? c.text.length > 70
          ? c.text.substr(0, 70) + '…'
          : c.text : link.key)
        var author = link.value.author
        var t = c.type === 'pull-request'
          ? link.state === 'open' ? openPRsT : closedPRsT
          : link.state === 'open' ? openIssuesT : closedIssuesT
        t.append(h('tr',
          h('td',
            h('a', {href: '#'+link.key}, title), h('br'),
            h('small',
              'opened ', messageTimestampLink(link),
              ' by ', h('a', {href: '#'+author}, api.avatar_name(author))))))
      }, function (err) {
        if (err) console.error(err)
      })
    )

    // list forks
    pull(
      getForks(msg.key),
      pull.drain(function (fork) {
        forksT.append(h('tr', h('td',
          repoLink(fork.id),
          ' by ', h('a', {href: '#'+fork.author}, api.avatar_name(fork.author)))))
      }, function (err) {
        if (err) console.error(err)
      })
    )

    return div
  }
}

