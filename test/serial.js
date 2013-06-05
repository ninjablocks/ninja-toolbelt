"use strict"
var assert = require('assert')
var serial = require('../lib/serial')
var fs = require('fs')

describe('getting a serial', function() {
  it('has a default file', function() {
    assert(serial.DEFAULT_FILE)
  })
  describe('reading from default file', function() {
    beforeEach(function(done) {
      serial.DEFAULT_FILE = '/tmp/serial.conf'
      fs.unlink(serial.DEFAULT_FILE, function() {
        //ignore err, probably file not exist
        done()
      })
    })
    describe('file creation', function() {
      it('creates a serial if file does not exist', function(done) {
        serial(function(err, theSerial) {
          assert.ifError(err)
          assert(theSerial)
          assert(fs.existsSync(serial.DEFAULT_FILE))
          assert.strictEqual(fs.readFileSync(serial.DEFAULT_FILE, 'utf8'), theSerial)
          done()
        })
      })
    })
    it('gets the serial from DEFAULT_FILE by default', function(done) {
      fs.writeFileSync(serial.DEFAULT_FILE, 'some serial')
      serial(function(err, theSerial) {
        assert.ifError(err)
        assert(theSerial)
        assert.strictEqual('some serial', theSerial)
        done()
      })
    })
    it('gets the serial from provided file if provided', function(done) {
      fs.writeFileSync('/tmp/another-serial.conf', 'some other serial')
      serial('/tmp/another-serial.conf', function(err, theSerial) {
        assert.ifError(err)
        assert(theSerial)
        assert.strictEqual('some other serial', theSerial)
        done()
      })
    })
  })
})
