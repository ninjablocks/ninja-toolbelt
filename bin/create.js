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
      write(path + '/lib/config-handlers.js', configHandlers);
      write(path + '/lib/config-messages.js', configMessages);
    });
    write(path + '/index.js', constructor);
  });
};

var constructor = [
    'var Device = require(\'./lib/device\')'
  , '  , util = require(\'util\')'
  , '  , stream = require(\'stream\')'
  , '  , configHandlers = require(\'./lib/config-handlers\');'
  , ''
  , '// Give our driver a stream interface'
  , 'util.inherits(myDriver,stream);'
  , ''
  , '// Our greeting to the user.'
  , 'var HELLO_WORLD_ANNOUNCEMENT = {'
  , '  "contents": ['
  , '    { "type": "heading",      "text": "Hello World Driver Loaded" },'
  , '    { "type": "paragraph",    "text": "The hello world driver has been loaded. You should not see this message again." }'
  , '  ]'
  , '};'
  , ''
  , '/**'
  , ' * Called when our client starts up'
  , ' * @constructor'
  , ' *'
  , ' * @param  {Object} opts Saved/default driver configuration'
  , ' * @param  {Object} app  The app event emitter'
  , ' * @param  {String} app.id The client serial number'
  , ' *'
  , ' * @property  {Function} save When called will save the contents of `opts`'
  , ' * @property  {Function} config Will be called when config data is received from the Ninja Platform'
  , ' *'
  , ' * @fires register - Emit this when you wish to register a device (see Device)'
  , ' * @fires config - Emit this when you wish to send config data back to the Ninja Platform'
  , ' */'
  , 'function myDriver(opts,app) {'
  , ''
  , '  var self = this;'
  , ''
  , '  app.on(\'client::up\',function(){'
  , ''
  , '    // The client is now connected to the Ninja Platform'
  , ''
  , '    // Check if we have sent an announcement before.'
  , '    // If not, send one and save the fact that we have.'
  , '    if (!opts.hasSentAnnouncement) {'
  , '      self.emit(\'announcement\',HELLO_WORLD_ANNOUNCEMENT);'
  , '      opts.hasSentAnnouncement = true;'
  , '      self.save();'
  , '    }'
  , ''
  , '    // Register a device'
  , '    self.emit(\'register\', new Device());'
  , '  });'
  , '};'
  , ''
  , '/**'
  , ' * Called when a user prompts a configuration.'
  , ' * If `rpc` is null, the user is asking for a menu of actions'
  , ' * This menu should have rpc_methods attached to them'
  , ' *'
  , ' * @param  {Object}   rpc     RPC Object'
  , ' * @param  {String}   rpc.method The method from the last payload'
  , ' * @param  {Object}   rpc.params Any input data the user provided'
  , ' * @param  {Function} cb      Used to match up requests.'
  , ' */'
  , 'myDriver.prototype.config = function(rpc,cb) {'
  , ''
  , '  var self = this;'
  , '  // If rpc is null, we should send the user a menu of what he/she'
  , '  // can do.'
  , '  // Otherwise, we will try action the rpc method'
  , '  if (!rpc) {'
  , '    return configHandlers.menu.call(this,cb);'
  , '  }'
  , '  else if (typeof configHandlers[rpc.method] === "function") {'
  , '    return configHandlers[rpc.method].call(this,rpc.params,cb);'
  , '  }'
  , '  else {'
  , '    return cb(true);'
  , '  }'
  , '};'
  , ''
  , ''
  , '// Export it'
  , 'module.exports = myDriver;'
].join(eol);

var device = [
    'var stream = require(\'stream\')'
  , '  , util = require(\'util\');'
  , ''
  , '// Give our device a stream interface'
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


var configHandlers = [
    'var configMessages = require(\'./config-messages\');'
  , ''
  , '/**'
  , ' * Called from the driver\'s config method when a'
  , ' * user wants to see a menu to configure the driver'
  , ' * @param  {Function} cb Callback to send a response back to the user'
  , ' */'
  , 'exports.menu = function(cb) {'
  , ''
  , '  cb(null,configMessages.menu);'
  , '};'
  , ''
  , '/**'
  , ' * Called when a user clicks the \'Echo back to me\''
  , ' * button we sent in the menu request'
  , ' * @param  {Object}   params Parameter object'
  , ' * @param  {Function} cb     Callback to send back to the user'
  , ' */'
  , 'exports.echo = function(params,cb) {'
  , ''
  , '  var echoText = params.echoText;'
  , '  var payloadToSend = configMessages.echo;'
  , ''
  , '  payloadToSend.contents.push({ "type": "paragraph", "text": params.hello_text });'
  , '  payloadToSend.contents.push({ "type": "close"    , "name": "Close" });'
  , ''
  , '  cb(null,payloadToSend);'
  , '};'
].join(eol);

var configMessages = [
    'exports.menu = {'
  , '  "contents":['
  , '    { "type": "paragraph", "text": "Welcome to the Hello World driver. Enter some text to echo back."},'
  , '    { "type": "input_field_text", "field_name": "hello_text", "value": "", "label": "Some Text", "placeholder": "Hellooooo!", "required": true},'
  , '    { "type": "submit", "name": "Echo back to me", "rpc_method": "echo" },'
  , '  ]'
  , '};'
  , ''
  , 'exports.echo = {'
  , '  "contents":['
  , '    { "type": "paragraph", "text": "You said"},'
  , '  ]'
  , '};'
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
