'use strict'

const path = require('path')

module.exports = async function (cli) {
  try {
    await cli.makeConfig('rest.js', path.join(__dirname, './templates/config.mustache'))
    cli.command.completed('create', `config/rest.js`)
  } catch (error) {
    // ignore errors
  }
}
