"use strict"

var os = require('os')
var platformDiagnostics = require('../package.json').diagnostics[os.platform()] || {}
var async = require('async')
var spawn = require('child_process').spawn
var through = require('through')

module.exports = function(diagnostics, opts, fn) {
  if (!diagnostics.length) diagnostics = Object.keys(platformDiagnostics)
  printDiagnostics(diagnostics, opts, fn)
}

/**
 * Print diagnostics in order.
 *
 * @param {Array} diagnostics names of diagnostics to run
 * @param {Object} opts optional spawn options for diagnostic commands
 * @param {Stream} opts.stdout optional stream to pipe stdout to
 * @param {Stream} opts.stderr optional stream to pipe stderr to
 * @param {Function} fn
 * @api private
 */

function printDiagnostics(diagnostics, opts, fn) {
  if (arguments.length === 2) {
    fn = opts
    opts = null
  }
  if (!opts) opts = {}

  if (!Array.isArray(diagnostics)) diagnostics = [diagnostics]
  diagnostics = diagnostics.slice()

  async.mapSeries(diagnostics, function(name, next) {
    run(name, function(err, child) {
      if (err) return next(err)

      child.stdout.setEncoding('utf8')
      child.stderr.setEncoding('utf8')

      var stdout = through()
      var stderr = through()

      child.stdout.pipe(stdout)
      child.stderr.pipe(stderr)
      child.on('close', function(code) {
        if (code !== 0) return next(new Error('command exited with non-zero status: ' + code))
        next()
      })

      if (opts.stdout) stdout.pipe(opts.stdout)
      if (opts.stderr) stderr.pipe(opts.stderr)

      stdout.write('\n\n' + name + ':\n\n')
    })
  }, function(err) {
    if (err) return fn(err)
    return fn()
  })
}

/**
 * Print diagnostics in order.
 *
 * @param {String} name name of diagnostics to run
 * @param {Function} fn
 * @api private
 */

function run(name, fn) {
  var opts = {}

  var commandLine = platformDiagnostics[name]
  if (!commandLine) return fn(new Error('diagnostic not found: '+ name + '. Valid options: ' + Object.keys(platformDiagnostics).join(', ')))

  var cmd = commandLine.split(' ')[0]

  var args = commandLine.split(' ').slice(1)
  return fn(null, spawn(cmd, args, opts))
}

module.exports.list = platformDiagnostics
