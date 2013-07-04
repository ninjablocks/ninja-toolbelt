"use strict"

var concat = require('concat-stream')
var spawn = require('child_process').spawn
var utils = require('../../utils')

module.exports = Diagnostic

function Diagnostic(diagnostics) {
  if (!(this instanceof Diagnostic)) return new Diagnostic(diagnostics)
  this.diagnostics = diagnostics
}

Diagnostic.prototype.get = function(diagnosticName, fn) {
  var stdout = ''
  var stderr = ''
  var child = this.getStreams(diagnosticName)

  if (!child) return fn(new Error('diagnostic not found: ' + diagnosticName))
  child.stdout.setEncoding('utf8')
  child.stderr.setEncoding('utf8')
  child.stderr.pipe(concat(function(data) {
    stderr = data
  }))
  child.stdout.pipe(concat(function(data) {
    stdout = data
  }))

  child.on('close', function(code) {
    if (code) return fn(new Error('process exited with non-zero status'), stdout, stderr)
    fn(null, stdout, stderr)
  })
}

Diagnostic.prototype.getStreams = function(diagnosticName) {
  var commandLine = this.diagnostics[diagnosticName]
  if (!commandLine) return null
  var cmd = commandLine.split(' ')[0]
  var args = commandLine.split(' ').slice(1)
  return spawn(cmd, args)
}
