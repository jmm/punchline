module.exports = lex;

var
  util = require('util')
  container_types = {
    list: {chars: ['(', ')']},
    array: {chars: ['[', ']']},
    object: {chars: ['{', '}']},
    double_quoted_string: {chars: ['"']},
    single_quoted_string: {chars: ["'"]},
  },
  reserved_words = [
    'false',
    'true',
    'null',
    'undefined',
  ],
  quoted_string_chars = [
    " ",
    ",",
    "'",
    '"',
    "[", "]",
    "(", ")",
    "{", "}",
    "\\",
    "$",
  ],
  list_delim = /[\s,]/;

Object.keys(container_types).forEach(function (id) {
  var type = container_types[id];
  type.id = id;
  if (type.chars.length === 1) type.chars.push(type.chars[0]);
});

function lex (input, opts) {
  opts = opts || {};

  var
    buffer = {input: input.split(''), output: []},
    collection = null,
    escaped = false,
    delimited = false,
    char,
    temp = {},
    i;

  buffer.output.punchline = {type: {id: 'top'}};

  function make_buffer () {
    collection = [];
    collection.punchline = {type: {}};
    return collection;
  };

  function push_buffer () {
    var collection = make_buffer();
    buffer.output.push(collection);
    return collection;
  }

  function pop_buffer () {
    collection = buffer.output.slice(-2)[0];

    if (
      (temp.list = buffer.output.pop()) &&
      (
        ['unquoted_string', 'variable'].indexOf(temp.list.type) < 0 ||
        temp.list.length
      )
    ) {
      collection.push(temp.list);
    }
  }

  function attrs (c) {
    c = c || collection;
    return c.punchline;
  }

  function transition (event, char) {
    var container;

    delimited = false;

    if (event === 'variable') {
      // temp.buffer = buffer.output.pop();
      // transition('descend');
      collection.punchline.type = {id: 'variable'};
      // buffer.output.push(temp.buffer);
    }

    else if (event !== 'ascend') {
      collection = push_buffer();

      // Descend into container
      Object.keys(container_types).every(function (type) {
        if (container_types[type].chars.indexOf(char) >= 0) {
          collection.punchline.type = container_types[type];
          return false;
        }
        return true;
      });

      if (! collection.punchline.type.id) {
        collection.punchline.type.id = event;
      }
    }
    // Always give new state crack at current char?
    else pop_buffer();
  }
  // transition


  function unquoted_string_eligible (char) {
    var
      delimiter = list_delim.test(char),
      eligible = (
        ! delimiter &&
        quoted_string_chars.indexOf(char) === -1
      );

    return eligible;
  }

  function variable_eligible (char) {
    // JMMDEBUG eliminate duplication
    return ['(', '[', '{'].indexOf(char) >= 0;
  }

  function closed_by (char) {
    return (! escaped && char === collection.punchline.type.chars[1]);
  }

  var handlers = {};

  handlers.list = function list (char) {
    if (unquoted_string_eligible(char)) {
      transition('unquoted_string');
      return handlers.unquoted_string(char);
    }
  };

  handlers.array = handlers.list;

  handlers.object = function (char) {
    var handled = handlers.start_end(char);
    if (! handled) collection.push(char);
    return true;
  };
  // object

  handlers.unquoted_string = function unquoted_string (char) {
    if (unquoted_string_eligible(char)) {
      collection.push(char);
      return true;
    }
    else if (collection.length && variable_eligible(char)) {
      transition('variable', char);
      return handlers.variable(char);
    }
    else {
      transition('ascend');
    }
  };
  // unquoted_string

  handlers.variable = function (char) {
    var handled = unquoted_string_eligible(char) || variable_eligible(char);
    if (unquoted_string_eligible(char)) {
      collection.push(char);
      handled = true;
    }
    else if (
      ! variable_eligible(char) ||
      ! (handled = handlers.start_end(char))
    ) {
      transition('ascend');
      handled = handlers.start_end(char);
    }
    return handled;
  };
  // variable

  handlers.quoted_string = function quoted_string (char) {
    var handled = handlers.start_end(char);

    if (! handled) {
      collection.push(char);
      if (! escaped && char === "\\") {
        escaped = true;
      }
      else if (escaped) escaped = false;

      handled = true;
    }

    return handled;
  };
  // quoted_string

  handlers.double_quoted_string =
    handlers.single_quoted_string = handlers.quoted_string;

  handlers.start_end = function start_end (char) {
    var
      handled = true,
      quoted = collection.punchline.type.id.match(/_quoted_string$/);

    // Start quote
    if (! quoted && ['"', "'"].indexOf(char) >= 0) {
      transition('quoted_string', char);
    }
    // Start container
    else if (! quoted && ['(', '[', '{'].indexOf(char) >= 0) {
      transition('descend', char);
    }
    // End container
    else if (collection.punchline.type.chars && closed_by(char)) {
      transition('ascend', char);
    }
    else handled = false;

    return handled;
  };
  // start_end

  handlers.literal = function (char) {
    var handled = handlers.start_end(char);
    if (! handled) collection.push(char);
    return true;
  };
  // literal


  collection = push_buffer();
  collection.punchline.type = {id: 'literal'};

  for (i = 0; i < buffer.input.length; ++i) {
    char = buffer.input[i];
    temp.handled = false;

    if ((i < 0) || (i > (buffer.input.length - 1))) {
      throw "Character index out of bounds";
    }

    [
      collection.punchline.type.id,
      'start_end',
    ].every(function (handler) {
      return ! handlers[handler](char);
    });
  }
  // for

  return buffer.output;
}
// lex
