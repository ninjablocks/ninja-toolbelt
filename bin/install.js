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

  dest = dest || process.cwd();

  request(sanitize(repo) + '/archive/master.zip')
    .pipe(unzip.Extract({ path: dest }))
    .on("close", installDependencies.bind(this,repo,dest))
    .on("error", function (er) {
      console.error("Error retrieving driver",er)
      process.exit(1);
    })
}

function sanitize(repo) {

  return repo.replace(/\.git|\/?$/g, '');
}

function installDependencies(repo,dest) {

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
      console.error(err);
      process.exit(1)
    } else {
      process.exit(0)
    }
  })
}

function moveIntoPlace(driverPath,cb) {

  var newPath = driverPath.replace(/-master?$/g,'');

  rmrf(newPath,function(err){
    if (err) return cb(err);
    else fs.rename(driverPath, newPath, cb);
  })
}