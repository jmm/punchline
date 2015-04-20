var
  vm = require('vm'),
  m = require('module'),
  interpret = require('./interpreter');

module.exports = function (instance, cmd) {
  cmd = interpret(cmd);

  var sandbox = vm.createContext({instance: instance});

  cmd = 'return instance' + cmd + '._punchline.opts;';

  return vm.runInContext(m.wrap(cmd), sandbox)(
    exports, require, module, __filename, __dirname
  );
};
