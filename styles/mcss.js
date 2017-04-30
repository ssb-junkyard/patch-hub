const { join, basename } = require('path')
const readDirectory = require('read-directory')
const { each } = require('libnested')
const nest = require('depnest')

exports.gives = nest('styles.mcss')

const contents = readDirectory.sync(join(__dirname, '..'), {
  extensions: false,
  filter: '**/*.mcss',
  ignore: '**/node_modules/**'
})

exports.create = function (api) {
  return nest('styles.mcss', mcss)

  function mcss (sofar = {}) {
    each(contents, (content, [filename]) => {
      const name = 'patch-git-' + basename(filename)
      sofar[name] = content
    })
    return sofar
  }
}

