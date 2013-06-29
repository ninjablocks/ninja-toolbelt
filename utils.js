"use strict"

var fs = require('fs')
var path = require('path')

exports.log = function log(log) {
  var args = [].slice.call(arguments, 1)
  console.error.apply(console, ['\x1b[36m ninja \x1b[0m ' + log].concat(args))
}
exports.log.error = function error(err) {
  var args = [].slice.call(arguments, 1)
  console.error.apply(console, ['\x1b[31m ninja \x1b[0m error ' + err].concat(args))
}

exports.error = function error(err) {
  exports.log.error.apply(null, arguments)
  process.exit(1)
}
