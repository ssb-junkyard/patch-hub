const nest = require('depnest')
const { h } = require('mutant')

exports.gives = nest('message.html.render')

exports.needs = nest({
  'message.html.markdown': 'first'
})

exports.create = function (api) {
  return nest('message.html.render', render)
    
  function render (msg) {
    var c = msg.value.content
    if (c.type !== 'issue') return 

    return // TODO : refactor to mutant standard ///////////////////

    return h('div', [
      c.title ? h('h4', c.title) : '',
      api.message.html.markdown(c)
    ])
  }
}
