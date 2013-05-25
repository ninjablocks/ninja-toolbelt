"use strict"

var request = require('request')
var unzip = require('unzip')
var async = require('async')
var rmrf = require('rimraf')
var path = require('path')
var npm = require('npm')
var fs = require('fs')
var DESTINATION_PATH
var REMOTE_LOCATION
var EXTRACTED_PATH

module.exports = function(program) {

  this.program = program;
  program
    .command('install <repository>')
    .description('fetch and install a driver from some repo')
    .action(fetch.bind(this));
}

function fetch(repo,dest,opts) {

  opts = (typeof dest === 'object' && dest || opts)
  dest = (typeof dest === 'string' && dest || process.cwd())

  configure(repo,dest,opts);

  console.log('\x1b[36m','ninja','\x1b[0m','fetching driver')

  request(REMOTE_LOCATION)
    .pipe(unzip.Extract({ path: dest }))
    .on("close", installDependencies.bind(this,repo,dest,opts))
    .on("error", function (err) {
      console.error('\x1b[31m','ninja','\x1b[0m','error', err)
      process.exit(1)
    })
}

function configure(repo,dest) {

  // check if we are already configured
  if (REMOTE_LOCATION && EXTRACTED_PATH && DESTINATION_PATH) return

  // bitbucket
  if (repo.match(/bitbucket.org/g)) {

    var sanitized = repo.replace(/https:\/\/bitbucket.org\/|\.git|\/?$/g, '')
    var extractedFolder = fs.readdirSync(dest).filter(function(element){
      return (element.indexOf(sanitized.replace('/','-')) === 0);
    })
    REMOTE_LOCATION   = 'https://bitbucket.org/' + sanitized + '/get/default.zip';
    DESTINATION_PATH  = path.resolve(dest, path.basename(sanitized))
    // Because we won't know what the folder is until after we extract it
    // We return if we don't have it knowing we'll be calling configure again
    if (extractedFolder.length===0) return
    EXTRACTED_PATH    = path.resolve(dest, extractedFolder[0])
    return
  }

  // default to github
  if (!repo.match(/github.com/g)) {
    console.error('\x1b[33m','ninja','\x1b[0m','url not provided, assuming github')
  }
  var sanitized = repo.replace(/https:\/\/github.com\/|\.git|\/?$/g, '')
  REMOTE_LOCATION   = 'https://github.com/' + sanitized + '/archive/master.zip'
  DESTINATION_PATH  = path.resolve(dest, path.basename(sanitized))
  EXTRACTED_PATH    = DESTINATION_PATH + '-master'
}


function installDependencies(repo,dest) {

  // Call configure again because of bitbucket.
  configure.apply(this,arguments);

  console.log('\x1b[36m','ninja','\x1b[0m','installing dependencies')
  process.chdir(EXTRACTED_PATH);

  async.series([
    npm.load,
    npm.install,
    moveIntoPlace
  ],function(err) {

    if (err) {
      console.error('\x1b[31m','ninja','\x1b[0m','error',err)
      process.exit(1)
    } else {
      console.log('\x1b[32m','ninja','\x1b[0m','done')
      process.exit(0)
    }
  })
}

function moveIntoPlace(cb) {

  console.log('\x1b[36m','ninja','\x1b[0m','moving into place')

  rmrf(DESTINATION_PATH, function(err) {
    if (err) return cb(err)
    else fs.rename(EXTRACTED_PATH, DESTINATION_PATH, cb)
  })
}