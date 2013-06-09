"use strict"

var childProcess = require('child_process')
var spawn = childProcess.spawn
var exec = childProcess.exec

var fs = require('fs-extra')

var npm = require('npm')
var gl = require('github-latest')

var utils = require('../utils')
var log = utils.log


var NPM_CMD = __dirname + '/../node_modules/.bin/npm'

var latest = function(user, name) {
  log('fetching latest tag %s/%s', user, name)
  return gl.apply(null, arguments)
}

/**
 * Install `repo` into `dir`
 *
 * @param {String} dir path to driver folder.
 * @param {String} repo driver to install
 * @param {Function} fn callback
 * @api public
 */

exports.install = function(dir, repo, fn) {
  if (!repo) return process.nextTick(function() {fn(new Error('repo required'))})
  if (!dir) return process.nextTick(function() {fn(new Error('dir required'))})

  ensurePackageJSON(dir, function(err) {
    if (err) return fn(err)
    linkNodeModules(dir, function(err) {
      if (err) return fn(err)
      repoToUrl(repo, function(err, path) {
        if (err) return fn(err)
        var args = 'install --save --color always ' + path
        spawn(NPM_CMD, args.split(' '), {
          cwd: dir,
          stdio: 'inherit'
        }).on('close', function(code) {
          if (code !== 0) return fn(new Error('npm install failed'))
          fn(null)
        })
      })
    })
  })
}

/**
 * Uninstall `repo` from `dir`, optionally wiping out
 * `config` directory, if supplied.
 *
 * @param {String} dir path to driver folder.
 * @param {String} config optional path to config folder.
 * @param {String} name driver to uninstall
 * @param {Function} fn callback
 * @api public
 */

exports.uninstall = function(dir, config, name, fn) {
  if (arguments.length === 3) {
    fn = name
    name = config
    config = null
  }
  exports._uninstall(dir, name, function(err) {
    if (err) return error(err)
    if (!config) return fn(null)
    fs.remove(config, function(err) {
      if (err) return error(err)
    })
  })
}

/**
 * Uninstall `repo` from `dir`.
 *
 * @param {String} dir path to driver folder.
 * @param {String} name driver to uninstall
 * @param {Function} fn callback
 * @api private
 */

exports._uninstall = function(dir, name, fn) {

  if (!name) return process.nextTick(function() {fn(new Error('name required'))})
  if (!dir) return process.nextTick(function() {fn(new Error('dir required'))})

  var args = 'uninstall --save --color always ' + name
  linkNodeModules(dir, function(err) {
    if (err) return fn(err)
    spawn(NPM_CMD, args.split(' '), {
      cwd: dir,
      stdio: 'inherit'
    }).on('close', function(code) {
      if (code !== 0) return fn(new Error('npm uninstall failed'))
      fn(null)
    })
  })
}

exports.list = function(dir, fn) {
  if (!dir) return process.nextTick(function() {fn(new Error('dir required'))})

  var args = 'ls --json'

  exec(NPM_CMD + ' ' + args, {
    cwd: dir,
    stdio: 'inherit'
  }, function(err, data) {
    if (err) return fn(err)
    try {
      var list = JSON.parse(data)
    } catch (e) {
      return fn(e)
    }
    fn(null, list.dependencies || [])
  })
}

function linkNodeModules(dir, fn) {
  fs.symlink('.', dir + '/node_modules', function(err) {
    fn(null) // ignore errors
  })
}

/**
 * Attempt to convert input repo name into something npm can
 * install from. Anything it doesn't know how to handle passes through unharmed.
 * Handles:
 *  - https://bitbucket.org/user/repo
 *  - https://github.com/user/repo
 *  - user/repo (assumes github)
 *  - user/repo@shaish (assumes github)
 *
 * @param {String} repo
 * @param {Function} fn callback
 * @api private
 */

function repoToUrl(repo, fn) {
  // handle bitbucket
  if (repo.match(/bitbucket.org/g)) {
    var sanitized = repo.replace(/https:\/\/bitbucket.org\/|\.git|\/?$/g, '')
    return fn(null, 'https://bitbucket.org/' + sanitized + '/get/default.zip')
  }

  var value = repo
  // handle repo/name@version
  if (/^([-.\w]+)\/([-.\w]+)(?:@([-.\w]+|\d+\.\d+\.\d+))?$/.exec(repo)) {
    value = 'http://github.com/'+RegExp.$1+'/'+RegExp.$2+'/tarball/'
    if (RegExp.$3) {
      value += RegExp.$3
      return fn(null, value)
    } else {
      return latest(RegExp.$1, RegExp.$2, function(e, tag){
        value += (tag || 'master')
        return fn(null, value)
      })
    }
  }
  // handle https://github.com/repo/name
  if (/^http.+github.com\/([-.\w]+)\/([-.\w]+)/.exec(repo)) {
    value = 'http://github.com/'+RegExp.$1+'/'+RegExp.$2+'/tarball/'
    return latest(RegExp.$1, RegExp.$2, function(e, tag){
      value += (tag || 'master')
      return fn(null, value)
    })
  }
  fn(null, repo) // hope npm can deal with the repo format
}

/**
 * Check if we have a valid package.json, otherwise create it.
 *
 * @param {String} path path to driver folder.
 * @param {Function} fn callback
 * @api private
 */

function ensurePackageJSON(path, fn) {
  fs.readFile(path + '/package.json', 'utf-8', function(err, data) {
    // create file if it does not exist
    if (err && err.code === 'ENOENT') return writePackageJSON(path, fn)
    if (err) return fn(err)
    try {
      var info = JSON.parse(data)
    } catch (e) {
      return fn(e)
    }
    return fn(null)
  })
}

/**
 * Write default package json for driver folder.
 * @param {String} path path to driver folder.
 * @param {Function} fn callback
 * @api private
 */

function writePackageJSON(path, fn) {
  var pkgJSON = JSON.stringify({name: 'ninja-drivers', private: true})
  fs.writeFile(path + '/package.json', pkgJSON, function(err) {
    if (err) return fn(err)
    fn(null)
  })
}
