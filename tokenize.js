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

  function text(code) {
    if (code === "*") {
      enter("emphasis", index);

      return emphasis;
    }

    console.log("TEXT:", code);
    return text;
  }

  function emphasis(code) {
    if (code === "*") {
      exit("emphasis", index + 1);
      return text;
    }

    console.log("EMPHASIS:", code);

    return emphasis;
  }

  let index = 0;
  let state = text;

  while (index < input.length) {
    const code = input[index];

    state = state(code);

    index++;
  }

  return events;
}

const input = "hello *world*";

console.log(tokenize(input));
