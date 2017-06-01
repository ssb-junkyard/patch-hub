const path = require('path')
const url = require('url')
const marked = require('ssb-marked')
const ref = require('ssb-ref')
const u = require('./util')
const emojiNamedCharacters = require('emoji-named-characters')

// render links to git objects and ssb objects
var blockRenderer = new marked.Renderer()
blockRenderer.urltransform = function (href) {
  if (ref.isLink(href))
    return u.encodeLink(href)
  if (/^[0-9a-f]{40}$/.test(href) && this.options.repo)
    return u.encodeLink([this.options.repo.id, 'commit', href])
  if (this.options.repo && this.options.rev && this.options.path
   && !url.parse(href).host && href[0] !== '#')
    return path.join('/', encodeURIComponent(this.options.repo.id),
      'blob', this.options.rev, this.options.path.join('/'), href)
  return href
}

blockRenderer.image = function (href, title, text) {
  href = href.replace(/^&amp;/, '&')
  var url
  if (ref.isBlobId(href))
    url = u.encodeLink(href)
  else if (/^https?:\/\//.test(href))
    url = href
  else if (this.options.repo && this.options.rev && this.options.path)
    url = path.join('/', encodeURIComponent(this.options.repo.id),
      'raw', this.options.rev, this.options.path.join('/'), href)
  else
    return text
  return '<img src="' + u.escape(url) + '" alt="' + text + '"' +
    (title ? ' title="' + title + '"' : '') + '/>'
}

blockRenderer.mention = function (preceding, id) {
  // prevent broken name mention
  if (id[0] == '@' && !ref.isFeed(id))
    return (preceding||'') + u.escape(id)

  return marked.Renderer.prototype.mention.call(this, preceding, id)
}

blockRenderer.listitem = function (text, checked) {
  return '<li>' +
    (checked === undefined ? '' : '<i>' + (checked ? '☑' : '☐') + '</i> ') +
    text + '</li>\n'
}

function renderEmoji(emoji) {
  return emoji in emojiNamedCharacters ?
      '<img src="/emoji/' + encodeURI(emoji) + '.png"'
      + ' alt=":' + escape(emoji) + ':"'
      + ' title=":' + escape(emoji) + ':"'
      + ' class="emoji" height="16" width="16">'
    : ':' + emoji + ':'
}

marked.setOptions({
  gfm: true,
  mentions: true,
  tables: true,
  breaks: true,
  pedantic: false,
  sanitize: true,
  smartLists: true,
  smartypants: false,
  emoji: renderEmoji,
  highlight: u.highlight,
  renderer: blockRenderer
})

// hack to make git link mentions work
var mdRules = new marked.InlineLexer(1, marked.defaults).rules
mdRules.mention =
  /^(\s)?([@%&][A-Za-z0-9\._\-+=\/]*[A-Za-z0-9_\-+=\/]|[0-9a-f]{40})/
mdRules.text = /^[\s\S]+?(?=[\\<!\[_*`:~]|https?:\/\/| {2,}\n| [@%&]|[0-9a-f]{40}|$)/

module.exports = function (text, options, cb) {
  if (!text) return ''
  if (typeof text != 'string') text = String(text)
  if (!options) options = {}
  else if (options.id) options = {repo: options}
  if (!options.rev) options.rev = 'HEAD'
  if (!options.path) options.path = []

  return marked(text, options, cb)
}

