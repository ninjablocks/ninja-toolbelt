"use strict"

var assert = require('assert')
var ipaddress = require('../lib/ipaddress')
var isme = require('isme')

describe('ipaddress', function() {
  it("gets the block's ip address on the network", function(done) {
    ipaddress(function(err, ips) {
      assert.ifError(err)
      // hard to test this I guess
      // what if the testing machine
      // doesn't have a network connection?
      assert.ok(Array.isArray(ips))
      // check ips if we got some back
      // depends on machine config
      if (ips.length) {
        var validIps = ips.filter(function(ip) {
          return isme(ip)
        })
        assert.strictEqual(validIps.length, ips.length)
      }
      done()
    })
  })
})
