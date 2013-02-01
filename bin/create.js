var exec = require('child_process').exec
  , mkdirp = require('mkdirp')
  , pkg = require('../package.json')
  , version = pkg.version
  , os = require('os')
  , fs = require('fs');

// end-of-line code

var eol = 'win32' == os.platform() ? '\r\n' : '\n'

module.exports = function(program) {

  this.program = program;
  program
    .command('create')
    .usage('<module name>')
    .action(createModule.bind(this));
};

function createModule(command) {

  var path = this.program.args.shift() || '.';

  emptyDirectory(path, function(empty){
    if (empty || this.program.force) {
      createModuleAt(path);
    } else {
      this.program.confirm('destination is not empty, continue? ', function(ok){
        if (ok) {
          process.stdin.destroy();
          createModuleAt(path);
        } else {
          abort('aborting');
        }
      });
    }
  }.bind(this));
}

function createModuleAt(path) {

  process.on('exit', function(){
    console.log();
    console.log('   create package.json:');
    console.log('     $ cd %s && npm init', path);
    console.log();
    console.log('   restart the client:');
    console.log('     $ sudo service ninjablock restart');
    console.log();
  });

  mkdir(path, function(){
    mkdir(path + '/lib', function(){
      write(path + '/lib/device.js', device);
    });
    write(path + '/index.js', constructor);
  });
};

var constructor = [
    'var Device = require(\'./lib/device\')'
  , '  , util = require(\'util\')'
  , '  , stream = require(\'stream\');'
  , ''
  , '// Give our module a stream interface'
  , 'util.inherits(myModule,stream);'
  , ''
  , '/**'
  , ' * Called when our client starts up'
  , ' * @constructor'
  , ' *'
  , ' * @param  {Object} opts Saved/default module configuration'
  , ' * @param  {Object} app  The app event emitter'
  , ' * @param  {String} app.id The client serial number'
  , ' *'
  , ' * @property  {Function} save When called will save the contents of `opts`'
  , ' * @property  {Function} config Will be called when config data is received from the Ninja Platform'
  , ' *'
  , ' * @fires register - Emit this when you wish to register a device (see Device)'
  , ' * @fires config - Emit this when you wish to send config data back to the Ninja Platform'
  , ' */'
  , 'function myModule(opts,app) {'
  , ''
  , '  var self = this;'
  , ''
  , '  app.on(\'client::up\',function(){'
  , ''
  , '    // The client is now connected to the Ninja Platform'
  , ''
  , '    // Do stuff with opts, and then commit it to disk'
  , '    if (!opts.hasMutated) {'
  , '      opts.hasMutated = true;'
  , '    }'
  , ''
  , '    self.save();'
  , ''
  , '    // Register a device'
  , '    self.emit(\'register\', new Device());'
  , '  });'
  , '};'
  , ''
  , '/**'
  , ' * Called when config data is received from the Ninja Platform'
  , ' * @param  {Object} config Configuration data'
  , ' */'
  , 'myModule.prototype.config = function(config) {'
  , ''
  , '};'
  , ''
  , '// Export it'
  , 'module.exports = myModule;'
].join(eol);

var device = [
  , 'var stream = require(\'stream\')'
  , '  , util = require(\'util\');'
  , ''
  , '// Give our module a stream interface'
  , 'util.inherits(Device,stream);'
  , ''
  , '// Export it'
  , 'module.exports=Device;'
  , ''
  , '/**'
  , ' * Creates a new Device Object'
  , ' *'
  , ' * @property {Boolean} readable Whether the device emits data'
  , ' * @property {Boolean} writable Whether the data can be actuated'
  , ' *'
  , ' * @property {Number} G - the channel of this device'
  , ' * @property {Number} V - the vendor ID of this device'
  , ' * @property {Number} D - the device ID of this device'
  , ' *'
  , ' * @property {Function} write Called when data is received from the Ninja Platform'
  , ' *'
  , ' * @fires data - Emit this when you wish to send data to the Ninja Platform'
  , ' */'
  , 'function Device() {'
  , ''
  , '  var self = this;'
  , ''
  , '  // This device will emit data'
  , '  this.readable = true;'
  , '  // This device can be actuated'
  , '  this.writeable = true;'
  , ''
  , '  this.G = "0"; // G is a string a represents the channel'
  , '  this.V = 0; // 0 is Ninja Blocks\' device list'
  , '  this.D = 2000; // 2000 is a generic Ninja Blocks sandbox device'
  , ''
  , '  process.nextTick(function() {'
  , ''
  , '    self.emit(\'data\',\'Hello World\');'
  , '  });'
  , '};'
  , ''
  , '/**'
  , ' * Called whenever there is data from the Ninja Platform'
  , ' * This is required if Device.writable = true'
  , ' *'
  , ' * @param  {String} data The data received'
  , ' */'
  , 'Device.prototype.write = function(data) {'
  , ''
  , '  // I\'m being actuated with data!'
  , '  console.log(data);'
  , '};'
  , ''
].join(eol);

/**
 * Check if the given directory `path` is empty.
 *
 * @param {String} path
 * @param {Function} fn
 */

function emptyDirectory(path, fn) {
  fs.readdir(path, function(err, files){
    if (err && 'ENOENT' != err.code) throw err;
    fn(!files || !files.length);
  });
}

/**
 * echo str > path.
 *
 * @param {String} path
 * @param {String} str
 */

function write(path, str) {
  fs.writeFile(path, str);
  console.log('   \x1b[36mcreate\x1b[0m : ' + path);
}

/**
 * Mkdir -p.
 *
 * @param {String} path
 * @param {Function} fn
 */

function mkdir(path, fn) {
  mkdirp(path, 0755, function(err){
    if (err) throw err;
    console.log('   \033[36mcreate\033[0m : ' + path);
    fn && fn();
  });
}

/**
 * Exit with the given `str`.
 *
 * @param {String} str
 */

function abort(str) {
  console.error(str);
  process.exit(1);
}
