"use strict"

var request = require('request')
var unzip = require('unzip')
var async = require('async')
var rmrf = require('rimraf')
var path = require('path')
var npm = require('npm')
var fs = require('fs')

module.exports = function(program) {

  this.program = program;
  program
    .command('install')
    .usage('<github repo>')
    .action(fetch.bind(this));
}

function fetch(repo,dest) {
  console.log('\x1b[36m','ninja','\x1b[0m','fetching driver');

  dest = determineDestination(dest);

  request(sanitize(repo) + '/archive/master.zip')
    .pipe(unzip.Extract({ path: dest }))
    .on("close", installDependencies.bind(this,repo,dest))
    .on("error", function (er) {
      console.error("Error retrieving driver",er)
      process.exit(1);
    })
}

function determineDestination(dest) {

  return typeof dest === 'string' && dest || process.cwd()
}

function sanitize(repo) {

  return repo.replace(/\.git|\/?$/g, '');
}

function installDependencies(repo,dest) {

  console.log('\x1b[36m','ninja','\x1b[0m','installing dependencies');
  // Github adds -master to the end of the directory unzipped
  // TODO get the folder name from the unzip?
  var driverPath = path.resolve(dest, path.basename(repo)) + '-master';
  process.chdir(driverPath);

  async.series([
    npm.load,
    npm.install,
    moveIntoPlace.bind(this,driverPath)
  ],function(err) {

    if (err) {
      console.error('\x1b[31m','ninja','\x1b[0m','error',err);
      process.exit(1)
    } else {
      console.log('\x1b[32m','ninja','\x1b[0m','done');
      process.exit(0)
    }
  })
}

function moveIntoPlace(driverPath,cb) {

  console.log('\x1b[36m','ninja','\x1b[0m','moving into place');

  var newPath = driverPath.replace(/-master?$/g,'');

  rmrf(newPath,function(err){
    if (err) return cb(err);
    else fs.rename(driverPath, newPath, cb);
  })
}