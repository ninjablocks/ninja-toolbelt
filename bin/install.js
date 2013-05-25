"use strict"

var request = require('request')
var rmrf = require('rimraf')
var unzip = require('unzip')
var async = require('async')
var path = require('path')
var npm = require('npm')
var fs = require('fs')
var DESTINATION_PATH
var REMOTE_LOCATION
var EXTRACTED_PATH

module.exports = function(program) {
  program
    .command('install <repository>')
    .description('fetch and install a driver from some repo')
    .action(fetch.bind(this));
}

function fetch(repo,dest,opts) {

  opts = (typeof dest === 'object' && dest || opts)
  dest = (typeof dest === 'string' && dest || process.cwd())

  configure(repo,dest,opts)

  console.log('\x1b[36m','ninja','\x1b[0m','fetching driver')

  request(REMOTE_LOCATION, function(err,resp){

    if (err || resp.statusCode !== 200) {
      error(err || 'received http status code '+resp.statusCode);
    }
  }).pipe(unzip.Extract({ path: dest }))
    .on("close", installDependencies.bind(this,repo,dest,opts))
    .on("error", error)
}

function configure(repo,dest) {

  // bail if we have been fully configured
  if (REMOTE_LOCATION && EXTRACTED_PATH && DESTINATION_PATH) return

  // bitbucket
  if (repo.match(/bitbucket.org/g)) {

    var sanitized     = repo.replace(/https:\/\/bitbucket.org\/|\.git|\/?$/g, '')
    REMOTE_LOCATION   = 'https://bitbucket.org/' + sanitized + '/get/default.zip'
    DESTINATION_PATH  = path.resolve(dest, path.basename(sanitized))

    // bitbucket appends the last commit ref
    // to the folder name that's extracted.
    // We need to go and try find the folder
    // after it's been extracted

    var extractedFolder = fs.readdirSync(dest).filter(function(element){
      return (element.indexOf(sanitized.replace('/','-')) === 0)
    })

    // due to the above behaviour, we call `configure` twice,
    // before the archive is downloaded, and after it has been extracted.
    // in the second call `extractedFolder` will contain the necessary
    // extracted folder name in the array.

    if (extractedFolder.length === 1)
      EXTRACTED_PATH = path.resolve(dest, extractedFolder[0])

    return
  }

  // default to github
  if (!repo.match(/github.com/g)) {
    console.log('\x1b[33m','ninja','\x1b[0m','url not provided, assuming github')
  }

  var sanitized     = repo.replace(/https:\/\/github.com\/|\.git|\/?$/g, '')
  REMOTE_LOCATION   = 'https://github.com/' + sanitized + '/archive/master.zip'
  DESTINATION_PATH  = path.resolve(dest, path.basename(sanitized))
  EXTRACTED_PATH    = DESTINATION_PATH + '-master'
}

function installDependencies(repo,dest) {

  console.log('\x1b[36m','ninja','\x1b[0m','installing dependencies')

  // Call configure again because of bitbucket.
  configure.apply(this,arguments)

  process.chdir(EXTRACTED_PATH)

  async.series([
    npm.load,
    npm.install,
    moveIntoPlace
  ],function(err) {

    if (err) {
      process.chdir('..')
      rmrf(EXTRACTED_PATH, function(e) {
        error(e||err)
      })
      return
    }

    console.log('\x1b[32m','ninja','\x1b[0m','done')
    process.exit(0)
  })
}

function moveIntoPlace(cb) {

  console.log('\x1b[36m','ninja','\x1b[0m','moving into place')

  rmrf(DESTINATION_PATH, function(err) {

    if (err) {
      cb(err);
      return
    }

    fs.rename(EXTRACTED_PATH, DESTINATION_PATH, cb)
  })
}

function error(err) {
  console.error('\x1b[31m','ninja','\x1b[0m','error:', err)
  process.exit(1)
}