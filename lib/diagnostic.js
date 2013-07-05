"use strict"

var os = require('os')
var platformDiagnostics = require('../package.json').diagnostics[os.platform()] || {}
var spawn = require('child_process').spawn

module.exports = function(diagnostics, fn) {
  if (!diagnostics.length) diagnostics = Object.keys(platformDiagnostics)
  printDiagnostics(diagnostics, fn)
}

/**
 * Print diagnostics in order.
 *
 * @param {Array} diagnostics names of diagnostics to run
 * @param {Function} fn
 */

function printDiagnostics(diagnostics, fn) {
  diagnostics = diagnostics.slice()
  function next() {
    var name = diagnostics.shift()
    if (!name) return false
    console.log('\r\n%s:\r\n', name) // print a header
    return printOneDiagnostic(name, function(err) {
      if (err) return fn(err)
      if (!next()) return fn()
    })
  }
  return next()
}

/**
 * Print diagnostics in order.
 *
 * @param {String} name name of diagnostics to run
 * @param {Function} fn
 */

function printOneDiagnostic(name, fn) {
  var commandLine = platformDiagnostics[name]
  if (!commandLine) return fn(new Error('diagnostic not found: '+ name + '. Valid options: ' + Object.keys(platformDiagnostics).join(', ')))
  var cmd = commandLine.split(' ')[0]
  var args = commandLine.split(' ').slice(1)
  spawn(cmd, args, {stdio: 'inherit', env: process.env})
  .on('close', function(code) {
    if (code !== 0) return fn(new Error('command exited with non-zero status: ' + code))
    fn()
  })
}

module.exports.list = platformDiagnostics
