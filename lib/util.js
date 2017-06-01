const pull = require('pull-stream')
// const { h } = require('mutant')
// const paramap = require('pull-paramap')
const Highlight = require('highlight.js')
// var removeMd = require('remove-markdown')
var u = {}

u.getExtension = function (filename) {
  var m = /\.([^.]+)$/.exec(filename)
  return m && m[1]
}

u.readObjectString = function (obj, cb) {
  pull(
    obj.read, 
    pull.collect((err, bufs) => {
      if (err) return cb(err)

      cb(null, Buffer.concat(bufs, obj.length).toString('utf8'))
    })
  )
}

u.decryptMessage = function (sbot, msg, cb) {
  var c = msg && msg.value && msg.value.content
  if (c && typeof c === 'string' && c.slice(-4) === '.box') {
    sbot.private.unbox(msg.value.content, function (err, content) {
      if (err || !content) return cb(null, msg) // leave message encrypted
      var msg1 = {}
      for (var k in msg) msg1[k] = msg[k]
      msg1.value = {}
      for (var j in msg.value) msg1.value[j] = msg.value[j]
      msg1.value.private = true
      msg1.value.content = content
      if (!content.recps) {
        sbot.whoami(function (err, feed) {
          if (err) return cb(err)
          content.recps = [msg1.value.author]
          if (feed.id !== msg1.value.author) content.recps.push(feed.id)
          cb(null, msg1)
        })
      } else cb(null, msg1)
    })
  } else cb(null, msg)
}

/* u.imgMimes = { */
//   png: 'image/png',
//   jpeg: 'image/jpeg',
//   jpg: 'image/jpeg',
//   gif: 'image/gif',
//   tif: 'image/tiff',
//   svg: 'image/svg+xml',
//   bmp: 'image/bmp'
// }
// u.readNext = function (fn) {
//   var next
//   return function (end, cb) {
//     if (next) return next(end, cb)

//     fn((err, _next) => {
//       if (err) return cb(err)

//       next = _next
//       next(null, cb)
//     })
//   }
// }

// u.readOnce = function (fn) {
//   var ended
//   return function (end, cb) {
//     fn((err, data) => {
//       if (err || ended) return cb(err || ended)

//       ended = true
//       cb(null, data)
//     })
//   }
// }

// u.when = function (bool, elFunction) {
//   return bool
//     ? elFunction()
//     : pull.once('')
// }

// u.sourceMap = function (source, fn) {
//   return pull(
//     source,
//     pull.filter(Boolean),
//     pull.map(fn)
//   )
// }

// u.paraSourceMap = function paraSourceMap (source, fn) {
//   return pull(
//     pull.values(source),
//     paramap(fn, 8)
//   )
// }

u.escape = function (str) {
  return String(str)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
}

u.encodeLink = function (url) {
  if (!Array.isArray(url)) url = [url]
  return '/' + url.map(encodeURIComponent).join('/')
}

// u.link = function (parts, text, raw, props) {
//   if (text == null) text = parts[parts.length-1]
//   if (!raw) text = u.escape(text)
//   return '<a href="' + u.encodeLink(parts) + '"' +
//     (props ? ' ' + props : '') +
//     '>' + text + '</a>'
// }

// u.timestamp = function (time, req) {
//   time = Number(time)
//   var d = new Date(time)
//   return '<span title="' + time + '">' +
//     d.toLocaleString(req._locale) + '</span>'
// }

// u.nav = function (links, page, after) {
//   return h('nav', [
//     u.sourceMap(pull.values(links), link => {
//       return h('a', {
//         href: (typeof link[0] == 'string') ? link[0] : u.encodeLink(link[0]),
//         class: (link[2] == page) ? 'active' : ''
//       },
//       link[1])
//     }),
//     pull.once(after || '')
//   ])
// }

// u.hiddenInputs = function (values) {
//   return Object.keys(values).map(function (key) {
//     return '<input type="hidden"' +
//       ' name="' + u.escape(key) + '"' +
//       ' value="' + u.escape(values[key]) + '"/>'
//   }).join('')
// }

u.highlight = function(code, lang) {
  if (!lang && /^#!\/bin\/[^\/]*sh$/m.test(code)) lang = 'sh'
  if (!lang || code.length > 100000) return u.escape(code)
  // auto highlighting removed because it was causing highlight.js to hang
  try {
    return Highlight.highlight(lang, code).value
  } catch(e) {
    if (!/^Unknown language:/.test(e.message)) console.error('highlight:', e)
    return u.escape(code)
  }
}

// u.pre = function (text) {
//   return '<pre>' + u.escape(text) + '</pre>'
// }

// u.json = function (obj) {
//   return u.linkify(u.pre(JSON.stringify(obj, null, 2)))
// }

// u.linkify = function (text) {
//   // regex is from ssb-ref
//   return text.replace(/(@|%|&|&amp;)[A-Za-z0-9\/+]{43}=\.[\w\d]+/g, function (str) {
//     return '<a href="/' + str + '">' + str + '</a>'
//   })
// }

// u.pullReverse = function () {
//   return function (read) {
//     return u.readNext(function (cb) {
//       pull(read, pull.collect(function (err, items) {
//         cb(err, items && pull.values(items.reverse()))
//       }))
//     })
//   }
// }

// function compareMsgs(a, b) {
//   return (a.value.timestamp - b.value.timestamp) || (a.key - b.key)
// }

// u.pullSort = function (comparator, descending) {
//   return function (read) {
//     return u.readNext(function (cb) {
//       pull(read, pull.collect(function (err, items) {
//         if (err) return cb(err)
//         items.sort(comparator)
//         if (descending) items.reverse()
//         cb(null, pull.values(items))
//       }))
//     })
//   }
// }

// u.sortMsgs = function (descending) {
//   return u.pullSort(compareMsgs, descending)
// }

// u.truncate = function (str, len) {
//   str = String(str)
//   return str.length < len ? str : str.substr(0, len) + '…'
// }

// u.messageTitle = function (msg) {
//   var c = msg.value.content
//   return u.truncate(c.title || c.text || msg.key, 40)
// }

// u.ifModifiedSince = function (req, lastMod) {
//   var ifModSince = req.headers['if-modified-since']
//   if (!ifModSince) return false
//   var d = new Date(ifModSince)
//   return d && Math.floor(d/1000) >= Math.floor(lastMod/1000)
// }


// u.isMessageReadable = function (msg) {
//   return msg && msg.value && msg.value.content
//     && typeof msg.value.content === 'object'
// }

// u.readableMessages = function () {
//   return pull.filter(u.isMessageReadable)
// }

// u.decryptMessages = function (sbot) {
//   return paramap(function (msg, cb) {
//     u.decryptMessage(sbot, msg, cb)
//   }, 4)
// }

// u.formatMarkdownTitle = function (title) {
//   return u.escape(removeMd(title))
// }

// u.privateIcon = function (req) {
//   return `<img src="/emoji/lock.png" height="16" width="16" alt="${req._t('repo.Private')}" title="${req._t('repo.RepoIsPrivate')}">`
// }

module.exports = u

