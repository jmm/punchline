module.exports = interpret;

var
  lex = require('./lexer'),
  parse = require('./parser');

function interpret (input) {
  return parse(lex(input));
}
