const pull = require('pull-stream')
const Next = require('pull-next')

module.exports = nextStepper

// TODO - this should be another module?
// definitely something - it's now duplicated across patchbay + patch-git

function nextStepper (createStream, opts, property, range) {
  range = range || (opts.reverse ? 'lt' : 'gt')
  property = property || 'timestamp'

  var last = null
  var count = -1

  return Next(function () {
    if (last) {
      if (count === 0) return
      var value = opts[range] = get(last, property)
      if (value == null) return
      last = null
    }
    return pull(
      createStream(clone(opts)),
      pull.through(function (msg) {
        count++
        if (!msg.sync) {
          last = msg
        }
      }, function (err) {
        // retry on errors...
        if (err) {
          count = -1
          return count
        }
        // end stream if there were no results
        if (last == null) last = {}
      })
    )
  })
}

function get (obj, path) {
  if (!obj) return undefined
  if (typeof path === 'string') return obj[path]
  if (Array.isArray(path)) {
    for (var i = 0; obj && i < path.length; i++) {
      obj = obj[path[i]]
    }
    return obj
  }
}

function clone (obj) {
  var _obj = {}
  for (var k in obj) _obj[k] = obj[k]
  return _obj
}


