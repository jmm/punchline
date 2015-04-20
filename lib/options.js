/*
This is the object that has the actual methods that store data in options hash.
*/

module.exports = Options;

var
  getters = {};


function Options (opts) {
  opts = opts || {};
  var
    self = this,
    props = opts.props || {};

  self._punchline = {
    opts: {},
    descriptors: {},
  };

  Object.keys(props).forEach(function (group_id) {
    var
      group = props[group_id];

    Object.keys(group).forEach(function (param_id) {
      group[param_id].forEach(function (alias) {
        self._punchline.descriptors[alias] = {
          get: self.make_getter(group_id, param_id, alias),
        };
      });
    });
    // group
  });
  // props

  return (
    opts.root ?
    self.decorate_getter(function () {
      return self.make_getter.apply(self, opts.root).apply(self, arguments);
    }.bind(self)) :
    self.set_descriptors(self)
  );
}
// Options

Options.prototype.set_descriptors = set_descriptors;
Options.prototype.make_getter = make_getter;
Options.prototype.decorate_getter = decorate_getter;

function set_descriptors (target) {
  var self = this;
  Object.keys(this._punchline.descriptors).forEach(function (prop) {
    Object.defineProperty(target, prop, self._punchline.descriptors[prop]);
  });
}

function decorate_getter (getter) {
  this.set_descriptors(getter);
  getter._punchline = this._punchline;
  getter.decorate_getter = decorate_getter;
  getter.make_getter = make_getter;
  getter.set_descriptors = set_descriptors;
  return getter;
}

function make_getter (group, prop, alias) {
  return this.decorate_getter(getters[group](prop, alias));
}

[
  function get_bool (prop, alias) {
    return function (val) {
      var invert, key = alias;
      key = key.match(/(.+?)(0?)$/);
      invert = key[2] && key[2].length ? !! Number(key[2]) : true;

      val = val !== undefined && invert !== false ? !! val : invert;
      this._punchline.opts[prop] = val;
      return this.make_getter('bool', prop);
    };
  },

  function get_assign (prop, alias) {
    return function (val) {
      if (val !== undefined) this._punchline.opts[prop] = val;
      return this.make_getter('assign', prop);
    };
  },

  function get_accumulate (prop, alias) {
    return function () {
      if (arguments.length) {
        this._punchline.opts[prop] =
          (this._punchline.opts[prop] || []).concat([].slice.call(arguments));
      }
      return this.make_getter('accumulate', prop);
    };
  },

  function get_subarg (prop, alias) {
    return function () {
      return function (f, opts) {
        return getters.accumulate(prop).call(this, {f: f, opts: opts});
      };
    };
  },
].forEach(function (getter) {
  getters[getter.name.match(/^get_(.+)/)[1]] = getter;
});
