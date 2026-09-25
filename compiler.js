const input = "*hello **world***";
const events = tokenize(input);
console.log(events);
console.log(compile(input, events));

function tokenize(input) {
  const events = [];
  const stack = [];

  function enter(token, start) {
    stack.push({ type: token, start });

    events.push({
      type: "enter",
      token,
      start,
    });
  }

  function exit(token, end) {
    const opened = stack.pop();

    if (opened.type !== token) {
      throw new Error(`Cannot close ${token}; top of stack is ${opened.type}`);
    }

    events.push({
      type: "exit",
      token,
      end,
    });
  }

  function emitText(start, end) {
    if (start < end) {
      enter("text", start);
      exit("text", end);
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
      index++;
      continue;
    }

    const starRun = getStarRunLength(input, index);

    if (stack.length === 0) {
      emitText(textStart, index);
      if (starRun >= 2) {
        enter("strong", index);
        index += 2;
      } else {
        enter("emphasis", index);
        index += 1;
      }

      textStart = index;
      continue;
    }

    const current = stack[stack.length - 1];

    if (current.type === "emphasis") {
      if (starRun >= 2) {
        emitText(textStart, index);
        enter("strong", index);

        index += 2;
        textStart = index;
        continue;
      }

      emitText(textStart, index);
      exit("emphasis", index + 1);

      index += 1;
      textStart = index;
      continue;
    }

    if (current.type === "strong") {
      if (starRun >= 2) {
        emitText(textStart, index);
        exit("strong", index + 2);

        index += 2;
        textStart = index;
        continue;
      }
    }

    index++;
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
