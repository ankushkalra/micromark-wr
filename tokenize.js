function tokenize(input) {
  const events = [];

  let index = 0;

  function consume(code) {
    console.log("consume:", code);
    index++;
  }

  function peek(offset = 0) {
    return input[index + offset];
  }

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

      consume(code);

      return emphasis;
    }

    consume(code);

    return text;
  }

  function emphasis(code) {
    if (code === "*") {
      consume(code);
      exit("emphasis", index);
      return text;
    }

    consume(code);
    return emphasis;
  }

  let state = text;

  while (index < input.length) {
    const code = input[index];

    state = state(code);
  }

  return events;
}

const input = "hello *world*";

console.log(tokenize(input));
