function tokenize(input) {
  let index = 0;

  function text(code) {
    if (code === "*") {
      return emphasis;
    }

    console.log("TEXT:", code);
    return text;
  }

  function emphasis(code) {
    if (code === "*") {
      return text;
    }

    console.log("EMPHASIS:", code);

    return emphasis;
  }

  let state = text;

  while (index < input.length) {
    const code = input[index];

    state = state(code);

    index++;
  }
}

tokenize("hello *world*");
