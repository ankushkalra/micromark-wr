function tokenize(input) {
  const events = [];

  let index = 0;

  const effects = {
    consume(code) {
      index++;
    },

    reprocess() {
      index--;
    },

    enter(token, start) {
      events.push({
        type: "enter",
        token,
        start,
      });
    },

    exit(token, end) {
      events.push({
        type: "exit",
        token,
        end,
      });
    },
  };

  function peek(offset = 0) {
    return input[index + offset];
  }

  function text(code) {
    if (code === "*") {
      effects.enter("emphasis", index);

      effects.consume(code);

      return emphasis;
    }

    effects.consume(code);

    return text;
  }

  function emphasis(code) {
    if (code === "*") {
      effects.consume(code);
      effects.exit("emphasis", index);
      return text;
    }

    effects.consume(code);
    return emphasis;
  }

  let state = text;

  while (index < input.length) {
    const code = input[index];

    console.log("BEFORE:", index, code);
    state = state(code);
    console.log("AFTER:", index);
  }

  return events;
}

console.log(tokenize("hello"));
console.log(tokenize("*hello*"));
console.log(tokenize("hello *world*"));
