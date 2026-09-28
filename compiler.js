const input = "*hello **world***";
const events = tokenize(input);
console.log(events);
console.log(compile(input, events));

function tokenize(input) {
  const events = [];
  const stack = [];

  const effects = {
    consume() {
      index++;
    },

    peek(offset = 0) {
      return input[index + offset];
    },

    enter(token, start = index) {
      stack.push({ type: token, start });

      events.push({
        type: "enter",
        token,
        start,
      });
    },

    exit(token, end = index) {
      const opened = stack.pop();

      if (!opened || opened.type !== token) {
        throw new Error(
          `Cannot close ${token}; top of stack is ${opened.type}`,
        );
      }

      events.push({
        type: "exit",
        token,
        end,
      });
    },
  };

  function emitText(start, end) {
    if (start < end) {
      effects.enter("text", start);
      effects.exit("text", end);
    }
  }

  function getStarRunLength(input, index) {
    let length = 0;

    while (effects.peek(length) === "*") {
      length++;
    }

    return length;
  }

  let index = 0;
  let textStart = 0;
  let emphasisStart = -1;
  let strongStart = -1;

  function text(code) {
    if (code !== "*") {
      effects.consume();
      return text;
    }

    emitText(textStart, index);

    const starRun = getStarRunLength();
    if (starRun >= 2) {
      effects.enter("strong", index);
      effects.consume();
      effects.consume();
      textStart = index;
      return strong;
    } else {
      effects.enter("emphasis", index);
      effects.consume();
      textStart = index;
      return emphasis;
    }
  }

  function emphasis(code) {
    if (code !== "*") {
      effects.consume();
      return emphasis;
    }
    const starRun = getStarRunLength();
    if (starRun >= 2) {
      emitText(textStart, index);
      effects.enter("strong", index);

      effects.consume();
      effects.consume();
      textStart = index;
      return strong;
    } else {
      emitText(textStart, index);
      effects.consume();
      effects.exit("emphasis", index);

      textStart = index;
      return text;
    }
  }

  function strong(code) {
    if (code !== "*") {
      effects.consume();
      return strong;
    }
    const starRun = getStarRunLength();
    if (starRun >= 2) {
      emitText(textStart, index);

      effects.consume();
      effects.consume();
      effects.exit("strong", index);

      textStart = index;
      return emphasis;
    }
    effects.consume();
    return strong;
  }

  let state = text;

  while (index < input.length) {
    state = state(effects.peek());
  }

  // EOF
  if (stack.length === 0) {
    emitText(textStart, input.length);
  } else {
    const opened = stack[0];
    emitText(opened.start, input.length);
  }

  return events;
}

function compile(input, events) {
  let output = "";
  let textStart = 0;

  for (const event of events) {
    if (event.type === "enter") {
      if (event.token === "text") {
        textStart = event.start;
      }

      if (event.token === "emphasis") {
        output += "<em>";
      }

      if (event.token === "strong") {
        output += "<strong>";
      }
    }

    if (event.type === "exit") {
      if (event.token === "text") {
        output += input.slice(textStart, event.end);
      }
      if (event.token === "emphasis") {
        output += "</em>";
      }
      if (event.token === "strong") {
        output += "</strong>";
      }
    }
  }

  return `<p>${output}</p>`;
}
