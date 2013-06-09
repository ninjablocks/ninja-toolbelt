"use strict"
var exec = require('child_process').exec
var spawn = require('child_process').spawn
var assert = require('assert')
var fs = require('fs-extra')

describe('uninstall', function() {
  before(function(done) {
    fs.remove('/tmp/test', function(err) {
      if (err) return done(err)
      fs.mkdir('/tmp/test', done)
    })
  })

  before(function(done) {
    this.timeout(60000) // wait a minute…
    exec(__dirname + '/.././bin/ninja install https://github.com/nexxy/ninja-isight --driver-path /tmp/test', function(err) {
      assert.ifError(err)
      assert(fs.existsSync('/tmp/test/ninja-isight/package.json'))
      done()
    })
  })

  it('exists and displays usage', function(done) {
    exec(__dirname + '/../bin/ninja uninstall --help', function(err, stdout) {
      assert.ifError(err)
      assert(/Usage: ninja-uninstall/gi.test(stdout))
      done()
    })
  })

  it('uninstalls and kills client when done', function(done) {
    // spawn a pretend client that writes its pid to a file
    // and waits to be closed
    var dummyClientExitCode = undefined
    var args = ['node', '-e', "var fs = require('fs'); fs.writeFileSync('/tmp/test/pid.pid', process.pid); setTimeout(function() {process.exit()}, 60000)"]
    spawn('/usr/bin/env', args, {stdio: 'inherit'})
    .on('error', done)
    .on('close', function(code) {
      dummyClientExitCode = code
    })

    spawn(__dirname + '/../bin/ninja', 'uninstall ninja-isight --driver-path /tmp/test --pid /tmp/test/pid.pid'.split(' '), {stdio: 'inherit'})
    .on('error', done)
    .on('close', function(code) {
      assert(!fs.existsSync('/tmp/test/ninja-isight/package.json'))
      assert.notStrictEqual(0, dummyClientExitCode) // if we kill it, it won't exit 0
      assert.strictEqual(0, code)
      done()
    })
  })
})
