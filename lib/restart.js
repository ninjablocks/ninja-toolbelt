"use strict"

var fs = require('fs')
var path = require('path')

var utils = require('../utils')
var log = utils.log

/**
 * Kill Ninja client. Assume it will be restarted, or we don't care if
 * it isn't.
 *
 * @param {String} pidFile Path to pid
 * @param {Function} cb Callback
 * @api private
 */

exports.killClient = function killClient(pidFile, cb) {
  if (!pidFile) return process.nextTick(cb)
  fs.readFile(path.resolve(process.cwd(), pidFile), function(err, data) {
    if (err) {
      log('could not read pid file %s', pidFile)
      return cb(err)
    }
    var pid = parseInt(data)
    if (pid) {
      log('killing client %d', pid)
      try {
        process.kill(pid)
      } catch(err) {
        log('failed to kill client %d', pid)
      }
    }
    cb()
  });
}
