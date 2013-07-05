"use strict"

var fs = require('fs')
var assert = require('assert')
var spawn = require('child_process').spawn
var concat = require('concat-stream')

var Diagnostics = require('../lib/diagnostic')

describe('ninja diagnostic', function() {
  it('does all diagnostics when not supplied a name', function(done) {
    var child = spawn(__dirname + '/../bin/ninja-diagnostic')
    child.stdout.setEncoding('utf8')
    child.stdout.pipe(concat(function(data) {
      Object.keys(Diagnostics.list).forEach(function(title){
        assert.ok(data.indexOf(title + ':') !== -1) // check for headers
      })
      assert.ok(data)
    }))
    child.on('exit', function(code) {
      assert.strictEqual(code, 0)
      done()
    })
  })
  it('runs a single diagnostic when passed a name', function(done) {
    var list = Object.keys(Diagnostics.list)
    var name = list[0]
    assert.ok(name, "No diagnostics?")
    var child = spawn(__dirname + '/../bin/ninja-diagnostic', [name])
    child.stdout.setEncoding('utf8')
    child.stdout.pipe(concat(function(data) {
      assert.ok(data.indexOf(name + ':') !== -1) // check for headers
      list.slice(1).forEach(function(title){
        assert.ok(data.indexOf(title + ':') === -1) // check for headers
      })
      assert.ok(data)
    }))
    child.on('exit', function(code) {
      assert.strictEqual(code, 0)
      done()
    })
  })
})

