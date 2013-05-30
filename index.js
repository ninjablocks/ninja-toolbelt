"use strict"

var join = require('path').join
var fs = require('fs')
var async = require('async')
var error = require('./utils').error
var from = require('from')
var through = require('through')
var concat = require('concat-stream')

module.exports = function(driverPath) {
  // TODO figure out better way to handle
  // keeping the driver path around
  // between calls.This closure is inflexible
  // when you already have absolute path.

  return {
    getInstalledDrivers: getInstalledDrivers,
    getDriverInfo: getDriverInfo
  }

  function getInstalledDrivers(fn) {
    fs.readdir(driverPath, function(err, dirs) {
      if (err) return fn(err)
      from(dirs)
      .pipe(through(function(folder) {
        var self = this
        hasPackageJson(folder, function(doesHave) {
          if (doesHave) self.push(folder)
        })
      }))
      .pipe(through(function(folder) {
        var self = this
        getDriverInfo(folder, function(err, info) {
          if (info) self.push(info)
        })
      }))
      .pipe(concat(function(driverInfo) {
        fn(null, driverInfo || [])
      }))
    })
  }

  function hasPackageJson(folder, fn) {
    fs.exists(join(driverPath, folder, 'package.json'), fn)
  }

  function getDriverName(folder, fn) {
    getDriverInfo(folder, function(err, info) {
      fn(err, info && info.name)
    })
  }

  function getDriverInfo(folder, fn) {
    fs.readFile(join(driverPath, folder, 'package.json'), {encoding: 'utf8'}, function(err, data) {
      if (err) return fn(err)
        var driverInfo
      try {
        driverInfo = JSON.parse(data)
      } catch (err) {
        return fn(err)
      }
      fn(null, driverInfo)
    })
  }
}

function unique(arr) {
  var dups = {};
  return arr.filter(function(el) {
    var hash = el.valueOf();
    var isDup = dups[hash];
    dups[hash] = true;
    return !isDup;
  });
}
