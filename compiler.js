const inputs = [
  "*hello **world***",
  "*a*",
  "*a **b** c",
  "**a*",
  "un*frigging*believable",
];
// const inputs = ["*a*", "**a**", "*a **b** c", "un*frigging*believable"];
// const inputs = ["*a*"];
// const inputs = ["*hello **world***"];
inputs.forEach((input) => {
  console.log("input = ", input);
  const events = tokenize(input);
  // console.log(events);
  console.log(compile(input, events));
});

function tokenize(input) {
  const events = [];
  const stack = [];

  function unclosed() {
    const outer = stack[0];
    events.length = outer.eventIndex;
    stack.length = 0;
    emitText(outer.start, index);
  }

  const effects = {
    consume() {
      index++;
    },

    peek(offset = 0) {
      return input[index + offset];
    },

    enter(token, start = index) {
      stack.push({ type: token, start, eventIndex: events.length });

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
  let runStart = -1;

  function text(code) {
    if (code === null) {
      emitText(textStart, index);
      return;
    }
    if (code !== "*") {
      effects.consume();
      return text;
    }

    emitText(textStart, index);
    textStart = index;
    runStart = index;
    return starRun(code);
  }

  function starRun(code) {
    if (code === "*") {
      effects.consume();
      return starRun;
    }

    effects.enter("starRun", runStart);
    effects.exit("starRun", index);
    textStart = index;
    return text(code);
  }

  function emphasis(code) {
    if (code === null) return unclosed();
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
    if (code === null) return unclosed();
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
  state(null);

  return resolve(events, input);
}

function resolve(events, input) {
  // Job 1: collect star runs
  const runs = [];
  const isSpace = (c) => c === undefined || /\s/.test(c);

  events.forEach((event, i) => {
    if (event.type === "enter" && event.token === "starRun") {
      const start = event.start;
      const end = events[i + 1].end;
      runs.push({
        start,
        end,
        length: end - start,
        remaining: end - start,
        closeCursor: start,
        openCursor: end,
        canOpen: !isSpace(input[end]),
        canClose: !isSpace(input[start - 1]),
      });
    }
  });

  // Job 2: pair closers with openers.
  const stack = [];
  const pairs = [];

  for (const run of runs) {
    if (run.canClose) {
      while (run.remaining > 0 && stack.length > 0) {
        const opener = stack[stack.length - 1];
        const use = opener.remaining >= 2 && run.remaining >= 2 ? 2 : 1;

        pairs.push({
          opener,
          closer: run,
          use,
          openAt: opener.openCursor - use,
          closeAt: run.closeCursor,
        });

        opener.openCursor -= use;
        run.closeCursor += use;

        opener.remaining -= use;
        run.remaining -= use;

        if (opener.remaining === 0) stack.pop();
      }
    }
    if (run.canOpen && run.remaining > 0) {
      stack.push(run);
    }
  }

  const result = [];
  let r = 0; // which run we're on

  for (let i = 0; i < events.length; i++) {
    const e = events[i];

    if (e.type === "enter" && e.token === "starRun") {
      const run = runs[r++];

      for (const p of pairs.filter((p) => p.closer === run)) {
        const token = p.use === 2 ? "strong" : "emphasis";
        result.push({ type: "exit", token, end: p.closeAt + p.use });
      }
      if (run.closeCursor < run.openCursor) {
        result.push({ type: "enter", token: "text", start: run.closeCursor });
        result.push({ type: "exit", token: "text", end: run.openCursor });
      }

      const opens = pairs
        .filter((p) => p.opener === run)
        .sort((a, b) => a.openAt - b.openAt);
      for (const p of opens) {
        const token = p.use === 2 ? "strong" : "emphasis";
        result.push({ type: "enter", token, start: p.openAt });
      }

      i++;
    } else {
      result.push(e);
    }
  }

  return result;
}

function compile(input, events) {
  let output = "";
  let textStart = 0;

  for (const event of events) {
    if (event.type === "enter") {
      if (event.token === "text" || event.token === "starRun") {
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
      if (event.token === "text" || event.token === "starRun") {
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
