var request = require('request')
"use strict"

var unzip = require('unzip')
var async = require('async')
var path = require('path')
var npm = require('npm')
var fs = require('fs')

module.exports = function(program) {

  this.program = program;
  program
    .command('install')
    .usage('<module name>')
    .option('-h, hello')
    .action(fetch.bind(this));
};

function fetch(repo,dest) {

  dest = dest || process.cwd();

  request(sanitize(repo) + '/archive/master.zip')
    .pipe(unzip.Extract({ path: dest }))
    .on("close", installDependencies.bind(this,repo,dest))
    .on("error", function (er) {
      console.error("Error retrieving driver",er)
      process.exit(1);
    })
};

function sanitize(repo) {

  return repo.replace(/\.git|\/?$/g, '');
};

function installDependencies(repo,dest) {

  // Github adds -master to the end of the directory unzipped
  // TODO get the folder name from the unzip?
  var driverPath = path.resolve(dest, path.basename(repo)) + '-master';
  process.chdir(driverPath);

  async.series([
    npm.load,
    npm.install,
    fs.rename.bind(this, driverPath, driverPath.replace(/-master?$/g,''))
  ],function(err) {

    if (err) {
      console.error(err);
      process.exit(1)
    } else {
      console.log('Done')
      process.exit(0)
    }
  })
};