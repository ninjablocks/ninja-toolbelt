"use strict"

var join = require('path').join
var fs = require('fs')
var async = require('async')
var error = require('./utils').error
var from = require('from')
var through = require('through')
var concat = require('concat-stream')

module.exports = function(driverPath) {
  driverPath = driverPath || ''
  // TODO figure out better way to handle
  // keeping the driver path around
  // between calls.This closure is inflexible
  // when you already have absolute path.

  return {
    getInstalledDrivers: getInstalledDrivers,
    getDriverInfo: getDriverInfo,
    findPathTo: findPathTo
  }

  function getInstalledDrivers(fn) {
    fs.readdir(driverPath, function(err, dirs) {
      if (err) return fn(err)
      from(dirs)
      .pipe(through(function(folder) {
        this.pause()
        var self = this
        hasPackageJson(folder, function(doesHave) {
          if (doesHave) {
            self.push(folder)
          }
          self.resume()
        })
      }))
      .pipe(through(function(folder) {
        this.pause()
        var self = this
        getDriverInfo(folder, function(err, info) {
          if (info) {
            self.push(info)
          }
          self.resume()
        })
      }))
      .pipe(concat(function(driverInfo) {
        fn(null, driverInfo || [])
      }))
    })
  }
  
  function findPathTo(driverName, fn) {
    getInstalledDrivers(function(err, drivers) {
      if (err) return fn(err)
      var match = drivers.filter(function(driver) {
        return driver.name === driverName
      })
      if (!match.length) return fn(new Error('driver not found:' + driverName))
      var driver = match[0] // assume 1 result.
      fn(null, driver.path)
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
