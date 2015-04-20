module.exports = parse;

function parse (buffer) {
  var
    new_buffer,
    temp = {};

  if (! Array.isArray(buffer)) return buffer;
  buffer.punchline = buffer.punchline || {};
  new_buffer = buffer.map(parse).join(
    ['list', 'array'].indexOf(buffer.punchline.type.id) >= 0 ?
    ', ' :
    ''
  );

  if (buffer.punchline.type.id === 'unquoted_string') {
    if (
      reserved_words.indexOf(new_buffer) < 0 &&
      ! new_buffer.match(/^[+-]?[0-9]*(\.[0-9]+|[eE][+-]?[0-9]+)?$/)
    ) {
      new_buffer = '"' + new_buffer + '"';
    }
  }
  else if (buffer.punchline.type.id === 'variable') {
    // JMMDEBUG identifier chars
    temp.var_name = new_buffer.match(/([a-z_$][a-z_$0-9]*)/i)[1];
    new_buffer = 'function ' + temp.var_name + ' (' + temp.var_name + ') {\n  ' + new_buffer + ';\n}';
  }
  else if (buffer.punchline.type.chars) {
    new_buffer =
      buffer.punchline.type.chars[0] +
      new_buffer +
      buffer.punchline.type.chars[1];
  }
  return new_buffer;
}
// parse
