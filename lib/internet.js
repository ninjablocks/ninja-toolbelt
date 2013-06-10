"use strict"

var hasinternet = require('hasinternet')
module.exports = function(fn) {
  hasinternet(function(err, status) {
    fn(null, status) // ignore error
  })
}
