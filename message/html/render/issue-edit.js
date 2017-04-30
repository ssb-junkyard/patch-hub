const nest = require('depnest')
const { h, when } = require('mutant')

exports.gives = nest('message.html.render')

exports.needs = nest({
  'message.html': {
    link: 'first',
    markdown: 'first'
  }
})

exports.create = function (api) {
  return nest('message.html.render', render)
    
  function render (msg) {
    var c = msg.value.content
    if (c.type !== 'issue-edit') return 

    return // TODO : refactor to mutant standard ///////////////////

    return h('div', [
      c.issue ? renderIssueEdit(c) : null,
      c.issues ? c.issues.map(renderIssueEdit) : null
    ])
  }

  function renderIssueEdit (c) {
    var id = c.issue || c.link
    return [
      when(c.title,
        h('p', [
          'renamed issue ', api.message.html.link(id), ' to ', h('ins', c.title)
        ])
      ),
      when(c.open === false,
        h('p', [
          'closed issue ', api.message.html.link(id)
        ])
      ),
      when(c.open === true,
        h('p', [
          'reopened issue ', api.message.html.link(id)
        ])
      )
    ]
  }
}

