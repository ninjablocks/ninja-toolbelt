"use strict"

var join = require('path').join
var fs = require('fs')
var async = require('async')


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
    return fs.readdir(driverPath, function(err, dirs) {
      if (err) return fn(err)
      async.filter(dirs, hasPackageJson, function(driverFolders) {
        async.map(driverFolders, getDriverName, function(err, folders) {
          if (err) return fn(err)
          fn(null, unique(folders))
        })
      })
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
      } catch(err) {
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
