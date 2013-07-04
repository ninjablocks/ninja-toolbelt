"use strict"

var fs = require('fs')
var assert = require('assert')

var Diagnostics = require('../lib/diagnostic')

describe('ninja diagnostic', function() {
  var beforeEnv = process.env.npm_package_config_diagnostic
  it('gets diagnostics from config', function(done) {
    var diagnostics = Diagnostics({
      test: "cat " + __filename
    })
    diagnostics.get("test", function(err, output, stderr) {
      assert.ifError(err)
      assert.equal(fs.readFileSync(__filename, 'utf8'), output)
      assert.ok(!stderr)
      done()
    })
  })
})

