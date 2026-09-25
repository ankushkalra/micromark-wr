const input = "hello **world**";
const events = tokenize(input);
console.log(events);
console.log(compile(input, events));

function tokenize(input) {
  const events = [];

  function enter(token, start) {
    events.push({
      type: "enter",
      token,
      start,
    });
  }

  function exit(token, end) {
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

  let index = 0;
  let state = "text";
  let tokenStart = 0;
  let emphasisStart = -1;
  let strongStart = -1;

  while (index < input.length) {
    const character = input[index];
    const next = input[index + 1];

    if (state === "text") {
      if (character === "*" && next === "*") {
        emitText(tokenStart, index);
        strongStart = index;
        tokenStart = index + 2;
        state = "strong";

        index += 2;
        continue;
      }

      if (character === "*") {
        emitText(tokenStart, index);
        emphasisStart = index;
        tokenStart = index + 1;
        state = "emphasis";

        index++;
        continue;
      }
    }

    if (state === "emphasis") {
      if (character === "*") {
        enter("emphasis", emphasisStart);

        emitText(tokenStart, index);

        exit("emphasis", index + 1);

        tokenStart = index + 1;
        state = "text";

        index++;
        continue;
      }
    }

    if (state === "strong") {
      if (character === "*" && next === "*") {
        enter("strong", strongStart);
        emitText(tokenStart, index);
        exit("strong", index + 2);

        tokenStart = index + 2;
        state = "text";

        index += 2;
        continue;
      }
    }

    index++;
  }

  // EOF
  if (state === "text") {
    emitText(tokenStart, input.length);
  } else if (state === "emphasis") {
    emitText(emphasisStart, input.length);
  } else if (state === "strong") {
    emitText(strongStart, input.length);
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
