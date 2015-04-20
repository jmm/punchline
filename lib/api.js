var
  exec = require('./exec');

module.exports = function (handler, cmd) {
  return handler.post(exec(handler.pre(), cmd));
};
