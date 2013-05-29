"use strict"

var fs = require('fs')
var path = require('path')

/**
 * Kill Ninja client. Assume it will be restarted, or we don't care if
 * it isn't.
 *
 * @param {String} pidFile Path to pid
 * @param {Function} cb Callback
 * @api private
 */

exports.killClient = function killClient(pidFile, cb) {
  if (!pidFile) return cb()
  fs.readFile(path.resolve(process.cwd(), pidFile), function(err, data) {
    if (err) {
      exports.log('could not read pid file %s', pidFile)
      return cb(err)
    }
    var pid = parseInt(data)
    if (pid) {
      exports.log('killing client %d', pid)
      try {
        process.kill(pid)
      } catch(err) {
        exports.log('failed to kill client %d', pid)
      }
    }
    cb()
  });
}

exports.log = function log(log) {
  var args = [].slice.call(arguments, 1)
  console.error.apply(console, ['\x1b[36m ninja \x1b[0m ' + log].concat(args))
}

exports.error = function error(err) {
  var args = [].slice.call(arguments, 1)
  console.error.apply(console, ['\x1b[31m ninja \x1b[0m error ' + err].concat(args))
  process.exit(1)
}
