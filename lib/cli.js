#! /usr/bin/env node

var
  api = require('./api'),
  path = require('path');

// JMMDEBUG this script will be just for direct execution, so for packages that
// don't ship with support, e.g.:
// $ punchline ./browserify 'x.y.z'

module.exports = cli;

function cli () {
  var
    matches,
    mod = process.argv[2],
    mod_path = mod,
    cmd = process.argv[3],
    adapter;

  // Path or module name?
  if (matches = mod.match(/^\.{0,2}\/(.+)/)) {
    mod_path = require.resolve(matches[1]);
    process.nextTick(ready);
  }
  else {
    var npm = require('npm');
    npm.load(function () {
      mod_path = path.join(
        npm.config.get('prefix'), 'lib', 'node_modules', mod
      );
      ready();
    });
  }

  // JMMDEBUG where to lookup handlers? E.g. package first then here?
  adapter = require('punchicize-' + (matches[1] || mod));

  function ready () {
    api(
      adapter({
        module: require(mod_path),
        default_adapter: require('./adapter'),
      }),
      cmd
    );
  }
};

cli();
