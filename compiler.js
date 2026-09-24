function tokenize(input) {
  const tokens = [];

  let index = 0;
  let state = "text";
  let tokenStart = 0;
  let emphasisStart = -1;

  while (index < input.length) {
    const character = input[index];

    // console.log(`state: ${state} character: ${character}`);

    if (state === "text" && character === "*") {
      if (tokenStart < index) {
        tokens.push({
          type: "text",
          value: input.slice(tokenStart, index),
        });
      }

      state = "emphasis";
      tokenStart = index + 1;
      emphasisStart = index;
    } else if (state === "emphasis" && character === "*") {
      tokens.push({
        type: "emphasis",
        value: input.slice(tokenStart, index),
      });

      state = "text";
      tokenStart = index + 1;
    }

    index++;
  }

  if (state === "text") {
    if (tokenStart < input.length) {
      tokens.push({
        type: "text",
        value: input.slice(tokenStart),
      });
    }
  } else if (state === "emphasis") {
    tokens.push({
      type: "text",
      value: input.slice(emphasisStart),
    });
  }

  return tokens;
}

function compile(tokens) {
  return (
    "<p>" +
    tokens
      .map((token) => {
        if (token.type === "text") {
          return token.value;
        }

        if (token.type === "emphasis") {
          return `<em>${token.value}</em>`;
        }
      })
      .join("") +
    "</p>"
  );
}

const tokens = tokenize("hello");
console.log(tokens);
console.log(compile(tokens));
const tokens1 = tokenize("hello *world*");
console.log(tokens1);
console.log(compile(tokens1));
const tokens2 = tokenize("*hello* world");
console.log(tokens2);
console.log(compile(tokens2));
const tokens3 = tokenize("hello *world");
console.log(tokens3);
console.log(compile(tokens3));
const tokens4 = tokenize("*hello");
console.log(tokens4);
console.log(compile(tokens4));
