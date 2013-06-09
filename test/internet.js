"use strict"

var assert = require('assert')
var internet = require('../lib/internet')
var isme = require('isme')
var net = require('net')

// how to test this properly?
// auto turn off the network during testing? ugh.
describe('has internet', function() {
  it("true if the machine has an internet connection", function(done) {
    internet(function(err, hasInternet) {
      // ignore err, it will be truthy if there is no internet
      // (e.g. ENOTFOUND)
      // pseudo double check of results.
      var connection = net.connect({port: 80, host: 'google.com'}, function() {
        assert.ok(hasInternet)
        connection.end()
        done()
      })

      connection.on('error', function() {
        assert.ok(!hasInternet)
        connection.end()
        done()
      })
    })
  })
})

