"use strict"

var spawn = require('child_process').spawn
var assert = require('assert')

describe('ninja restart', function() {
  it('kills client', function(done) {
    // spawn a pretend client that writes its pid to a file
    // and waits to be closed
    var dummyClientExitCode = undefined
    var args = ['node', '-e', "var fs = require('fs'); fs.writeFileSync('/tmp/test-pid.pid', process.pid); setTimeout(function() {process.exit()}, 60000)"]
    spawn('/usr/bin/env', args, {stdio: 'inherit'})
    .on('error', done)
    .on('close', function(code) {
      dummyClientExitCode = code
    })

    spawn(__dirname + '/../bin/ninja', 'restart --pid /tmp/test-pid.pid'.split(' '), {stdio: 'inherit'})
    .on('error', done)
    .on('close', function(code) {
      assert.notStrictEqual(0, dummyClientExitCode) // if we kill it, it won't exit 0
      assert.strictEqual(0, code)
      done()
    })
  })
})
