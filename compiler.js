const input = "hello *world*";
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

  let index = 0;
  let state = "text";
  let tokenStart = 0;
  let emphasisStart = -1;

  while (index < input.length) {
    const character = input[index];

    if (state === "text" && character === "*") {
      if (tokenStart < index) {
        enter("text", tokenStart);
        exit("text", index);
      }

      emphasisStart = index;
      state = "emphasis";
      tokenStart = index + 1;
    } else if (state === "emphasis" && character === "*") {
      enter("emphasis", emphasisStart);
      enter("text", tokenStart);
      exit("text", index);
      exit("emphasis", index + 1);

      state = "text";
      tokenStart = index + 1;
    }

    index++;
  }

  if (state === "text") {
    if (tokenStart < input.length) {
      enter("text", tokenStart);
      exit("text", input.length);
    }
  } else if (state === "emphasis") {
    enter("text", emphasisStart);
    exit("text", input.length);
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
    }

    if (event.type === "exit") {
      if (event.token === "text") {
        output += input.slice(textStart, event.end);
      }
      if (event.token === "emphasis") {
        output += "</em>";
      }
    }
  }

  return `<p>${output}</p>`;
}
