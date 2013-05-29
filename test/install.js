"use strict"
var exec = require('child_process').exec
var spawn = require('child_process').spawn
var assert = require('assert')
var rmrf = require('rimraf')
var fs = require('fs')
describe('install', function() {
  beforeEach(function(done) {
    rmrf('/tmp/test', function(err) {
      if (err) return done(err)
      fs.mkdir('/tmp/test', done)
    })
  })
  it('exists and displays usage', function(done) {
    exec(__dirname + '/../bin/ninja install --help', function(err, stdout) {
      assert.ifError(err)
      assert(/Usage: ninja-install/gi.test(stdout))
      done()
    })
  })
  it('installs drivers into specified folder', function(done) {
    this.timeout(60000) // wait a minute…
    exec(__dirname + '/.././bin/ninja install https://github.com/nexxy/ninja-isight --driver-path /tmp/test', function(err) {
      assert.ifError(err)
      assert(fs.existsSync('/tmp/test/ninja-isight/package.json'))
      done()
    })
  })
  it('kills client when done', function(done) {
    this.timeout(60000) // wait a minute…
    // spawn a pretend client that writes its pid to a file
    // and waits to be closed
    var dummyClientExitCode = undefined
    var args = ['node', '-e', "var fs = require('fs'); fs.writeFileSync('/tmp/test/pid.pid', process.pid); setTimeout(function() {process.exit()}, 60000)"]
    spawn('/usr/bin/env', args, {stdio: 'inherit'})
    .on('error', done)
    .on('close', function(code) {
      dummyClientExitCode = code
    })

    spawn(__dirname + '/../bin/ninja', 'install https://github.com/nexxy/ninja-isight --driver-path /tmp/test --pid /tmp/test/pid.pid'.split(' '), {stdio: 'inherit'})
    .on('error', done)
    .on('close', function(code) {
      assert.notStrictEqual(0, dummyClientExitCode) // if we kill it, it won't exit 0
      assert.strictEqual(0, code)
      done()
    })
  })
})
