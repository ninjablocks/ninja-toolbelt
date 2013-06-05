var crypto = require('crypto')
var fs = require('fs')
var argv = require('ninja-client/app/argv')

// TODO unify serial handling across
// * https://github.com/ninjablocks/client/blob/a8ecbfa307aa93bcad9b64d508fb6ef63635fb06/lib/credentials.js#L48
// * https://github.com/ninjablocks/utilities/blob/310e10f65ca87f3b737e9192f257c456f99c888c/bin/serialnumber 
// * and here.
// Main problem is that it's hard to test without involving all the actors.

module.exports = function(file, fn) {
  if (arguments.length === 1) {
    fn = file
    file = module.exports.DEFAULT_FILE
  }
  // figure out where the serial file is
  // by using magic in ninja-client/app/argv
  fs.readFile(file, 'utf8', function(err, serial) {
    // write new serial file if we haven't got one
    if (err && err.code === 'ENOENT') return writeNewSerial(file, fn)
    if (err) return fn(err)
    return fn(null, serial)
  })

  function handleError(err, fn) {
    return fn(err)
  }
}

module.exports.DEFAULT_FILE = argv.serialFile

/**
 * Create new serial, write to the `file`
 * @param {Function} fn Callback
 * @api private
 */

function writeNewSerial(file, fn) {
  var serial = generateSerial()
  return fs.writeFile(file, serial, function(err) {
    if (err) return fn(err)
    return fn(null, serial)
  })
}

/**
 * @return {String} a random serial number. Not guaranteed to be unique.
 * @api private
 */

function generateSerial() {
  return crypto
				.randomBytes(8)
				.toString('hex')
				.toUpperCase()
}
