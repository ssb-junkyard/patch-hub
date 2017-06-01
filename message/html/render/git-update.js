const nest = require('depnest')
const { h, when } = require('mutant')
const extend = require('xtend')

exports.gives = nest('message.html.render')

exports.needs = nest({
  'git.obs.repoName': 'first',
  'message.html': {
    decorate: 'reduce',
    layout: 'first',
    link: 'first'
  }
})

exports.create = function (api) {
  return nest('message.html.render', render)
    
  function render (msg) {
    if (msg.value.content.type !== 'git-update') return 

    const element = api.message.html.layout(msg, extend({
      content: renderContent(msg),
      layout: 'default'
    }, opts))

    return api.message.html.decorate(element, { msg })
  }

  function renderContent (msg) { 
    const { repo, refs, commits = [] , commits_more, issues = [] } = msg.value.content
    return h('GitUpdate', [
      h('header', [
        h('a', { href: repo }, api.git.obs.repoName(repo))
      ]),
      when(branchUpdates(refs).length, 
        h('section.branches', [
          h('header', 'branches'),
          h('div.details', branchUpdates(refs).map(ref => {
            var rev = refs[ref]
            return h('div', [
              shortRefName(ref) + ': ', rev ? h('code', rev) : h('em', 'deleted')
            ])
          }))
        ])
      ),
      when(tagUpdates(refs).length, 
        h('section.tags', [
          h('header', 'tags'),
          h('div.details', tagUpdates(refs).map(ref => {
            var rev = refs[ref]
            return h('div', [
              shortRefName(ref) + ': ', rev ? h('code', rev) : h('em', 'deleted')
            ])
          }))
        ])
      ),
      when(commits.length, 
        h('section.commits', [
          h('header', 'commits'),
          h('div.details', [ 
            commits.map(commit => {
              return h('div', [
                when(typeof commit.sha1 === 'string',
                  [h('code', commit.sha1.substr(0, 8)), ' ']
                ),
                when(commit.title, h('q', commit.title))
              ])
            }),
            when(commits_more > 0, 
              h('div', ['+ ', commits_more, ' more'])
            )
          ])
        ])
      ),
      when(issues.length,
        issues.map(issue => {
          if (issue.merged === true)
            return h('p', [
              'Merged ', api.message.html.link(issue.link), ' in ',
              h('code', issue.object), ' ', h('q', issue.label)
            ])
          if (issue.open === false)
            return h('p', [
              'Closed ', api.message.html.link(issue.link), ' in ',
              h('code', issue.object), ' ', h('q', issue.label)
            ])
        })
      ),
      // TODO
      // newPullRequestButton.call(this, msg)
    ])

  }
}

function branchUpdates (refs) {
  return Object.keys(refs).filter(ref => ref.match(/^refs\/heads/))
}

function tagUpdates (refs) {
  return Object.keys(refs).filter(ref => ref.match(/^refs\/tags/))
}

function shortRefName(ref) {
  return ref.replace(/^refs\/(heads|tags)\//, '')
}

