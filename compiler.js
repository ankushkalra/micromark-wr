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

    while (input[index + length] === "*") {
      length++;
    }

    return length;
  }

  let index = 0;
  let state = "text";
  let textStart = 0;
  let emphasisStart = -1;
  let strongStart = -1;

  while (index < input.length) {
    const character = input[index];

    if (character !== "*") {
      effects.consume();
      continue;
    }

    const starRun = getStarRunLength(input, index);

    if (stack.length === 0) {
      emitText(textStart, index);
      if (starRun >= 2) {
        effects.enter("strong", index);
        effects.consume();
        effects.consume();
      } else {
        effects.enter("emphasis", index);
        effects.consume();
      }

      textStart = index;
      continue;
    }

    const current = stack[stack.length - 1];

    if (current.type === "emphasis") {
      if (starRun >= 2) {
        emitText(textStart, index);
        effects.enter("strong", index);

        effects.consume();
        effects.consume();
        textStart = index;
        continue;
      }

      emitText(textStart, index);
      effects.exit("emphasis", index + 1);

      effects.consume();
      textStart = index;
      continue;
    }

    if (current.type === "strong") {
      if (starRun >= 2) {
        emitText(textStart, index);
        effects.exit("strong", index + 2);

        effects.consume();
        effects.consume();
        textStart = index;
        continue;
      }
    }

    effects.consume();
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
