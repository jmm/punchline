/*
This is a generic adapter that loops props to setup aliases.
*/

module.exports = Adapter;

var
  Options = require('../lib/options');

function Adapter (opts) {
  opts = opts || {};

  if (! (this instanceof Adapter)) return new Adapter(opts);

  var
    props = opts.props;

  // Set some aliases.
  Object.keys(props).forEach(function (group_id) {
    var
      group = props[group_id];

    Object.keys(group).forEach(function (param_id) {
      group[param_id].push(param_id);

      if (group_id === 'bool') {
        group[param_id].forEach(function (alias) {
          // JMMDEBUG guard against duplicate?
          group[param_id].push(alias + '0');
        });
      }
    });
    // group
  });
  // props

  return new Options(opts);
};
// Adapter
