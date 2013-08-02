"use strict"

var fs = require('fs')
var assert = require('assert')
var spawn = require('child_process').spawn
var concat = require('concat-stream')

var Diagnostics = require('../lib/diagnostic')

describe('ninja diagnostic', function() {
  describe('lib', function() {
    it('can take streams for stdout, stderr', function(done) {
      Diagnostics('uname', {
        stdout: concat(function(data) { // stdout
          assert.ok(data)
        }),
        stderr: concat(function(data) { // stderr
          assert.ok(!data) // should be no stderr
        })
      }, done)
    })
  })

  describe('bin', function() {
    it('does all diagnostics when not supplied a name', function(done) {
      this.timeout(60000)
      var stderr = ''
      var child = spawn(__dirname + '/../bin/ninja-diagnostic', [], {env: process.env})
      child.stdout.setEncoding('utf8')
      child.stderr.setEncoding('utf8')
      child.stdout.pipe(concat(function(data) {
        Object.keys(Diagnostics.list).forEach(function(title){
          assert.ok(data.indexOf(title) !== -1, "Missing header: " + title) // check for headers
        })
        assert.ok(data)
      }))
      child.stderr.pipe(concat(function(data) {
        stderr = data
      }))
      child.on('exit', function(code) {
        assert.strictEqual(code, 0, stderr)
        done()
      })
    })

    it('runs a single diagnostic when passed a name', function(done) {
      this.timeout(60000)
      var list = Object.keys(Diagnostics.list)
      var name = list[0]
      assert.ok(name, "No diagnostics?")
      var stderr = ''
      var child = spawn(__dirname + '/../bin/ninja-diagnostic', [name])
      child.stdout.setEncoding('utf8')
      child.stdout.pipe(concat(function(data) {
        assert.ok(data.indexOf(name) !== -1, "Missing header: " + name) // check for headers
        list.slice(1).forEach(function(title){
          assert.ok(data.indexOf(title) === -1, "Missing header: " + title) // check for headers
        })
        assert.ok(data)
      }))
      child.stderr.pipe(concat(function(data) {
        stderr = data
      }))
      child.on('exit', function(code) {
        assert.strictEqual(code, 0, stderr)
        done()
      })
    })
  })
})

