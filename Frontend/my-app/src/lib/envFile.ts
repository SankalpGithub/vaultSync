export interface EnvVariable {
  key: string;
  value: string;
}

function findClosingQuote(value: string, quote: string) {
  let escaped = false;

  for (let index = 0; index < value.length; index += 1) {
    const character = value[index];
    if (quote === '"' && escaped) {
      escaped = false;
      continue;
    }
    if (quote === '"' && character === "\\") {
      escaped = true;
      continue;
    }
    if (character === quote) return index;
  }

  return -1;
}

function decodeDoubleQuotedValue(value: string) {
  return value.replace(/\\(u[0-9a-fA-F]{4}|[\s\S])/g, (_match, escaped: string) => {
    switch (escaped) {
      case "n":
        return "\n";
      case "r":
        return "\r";
      case "t":
        return "\t";
      case "b":
        return "\b";
      case "f":
        return "\f";
      case '"':
      case "\\":
        return escaped;
      default:
        return escaped.startsWith("u")
          ? String.fromCharCode(Number.parseInt(escaped.slice(1), 16))
          : `\\${escaped}`;
    }
  });
}

export function parseEnvFile(source: string): EnvVariable[] {
  const lines = source.replace(/^\uFEFF/, "").split(/\r\n|\n|\r/);
  const variables: EnvVariable[] = [];

  for (let index = 0; index < lines.length; index += 1) {
    const line = lines[index];
    if (!line.trim() || line.trimStart().startsWith("#")) continue;

    const assignment = line.match(/^\s*(?:export\s+)?([\w.-]+)\s*=\s*(.*)$/);
    if (!assignment) {
      throw new Error(`Could not parse .env entry on line ${index + 1}.`);
    }

    const key = assignment[1];
    const rawValue = assignment[2].trimStart();
    let value: string;

    if (rawValue.startsWith('"') || rawValue.startsWith("'") || rawValue.startsWith("`")) {
      const quote = rawValue[0];
      let quotedValue = rawValue.slice(1);
      let closingQuote = findClosingQuote(quotedValue, quote);

      while (closingQuote === -1 && index + 1 < lines.length) {
        index += 1;
        quotedValue += `\n${lines[index]}`;
        closingQuote = findClosingQuote(quotedValue, quote);
      }

      if (closingQuote === -1) {
        throw new Error(`Unterminated quoted value on .env line ${index + 1}.`);
      }

      const trailingText = quotedValue.slice(closingQuote + 1).trim();
      if (trailingText && !trailingText.startsWith("#")) {
        throw new Error(`Unexpected text after .env value on line ${index + 1}.`);
      }

      const quotedContent = quotedValue.slice(0, closingQuote);
      value = quote === '"' ? decodeDoubleQuotedValue(quotedContent) : quotedContent;
    } else {
      value = rawValue.replace(/\s+#.*$/, "").trim();
    }

    variables.push({ key, value });
  }

  return variables;
}

export function serializeEnvFile(variables: EnvVariable[]) {
  return `${variables
    .map(({ key, value }) => {
      if (!/^[\w.-]+$/.test(key)) {
        throw new Error(`Secret key "${key}" is not a valid .env variable name.`);
      }
      return `${key}=${JSON.stringify(value)}`;
    })
    .join("\n")}\n`;
}
