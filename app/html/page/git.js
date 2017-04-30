const nest = require('depnest')
const { h } = require('mutant')
const pull = require('pull-stream')
const Scroller = require('pull-scroll')

const next = require('../../../junk/next-stepper')

exports.gives = nest({
  'app.html': {
    menuItem: true,
    page: true
  }
})

exports.needs = nest({
  'app.html': {
    filter: 'first',
    scroller: 'first'
  },
  'app.sync.goTo': 'first',
  'message.html': {
    render: 'first'
  },
  'sbot.pull.log': 'first'
})

exports.create = function (api) {
  const route = '/git'

  return nest({
    'app.html': {
      menuItem,
      page
    }
  })

  function menuItem () {
    return h('a', {
      style: { order: 10 },
      'ev-click': () => api.app.sync.goTo(route)
    }, route)
  }

  function page (path, sbot) {
    if (path !== route) return 

    const title = h('h1', 'Git stream')
    const { filterMenu, filterDownThrough, filterUpThrough, resetFeed } = api.app.html.filter(draw)
    const { container, content } = api.app.html.scroller({ prepend: [title, filterMenu] })

    function draw () {
      resetFeed({ container, content })

      pull(
        next(api.sbot.pull.log, {old: false, limit: 100}),
        filterUpThrough(),
        pull.filter(msg => msg.value.content.type),
        pull.filter(msg => msg.value.content.type.match(/^git/)),
        Scroller(container, content, api.message.html.render, true, false)
      )

      pull(
        next(api.sbot.pull.log, {reverse: true, limit: 100, live: false}),
        filterDownThrough(),
        pull.filter(msg => msg.value.content.type),
        pull.filter(msg => msg.value.content.type.match(/^git/)),
        Scroller(container, content, api.message.html.render, false, false)
      )
    }
    draw()

    return container
  }
}

