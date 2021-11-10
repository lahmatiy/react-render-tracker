// Adopted version of StackTrace-Parser
// https://github.com/errwischt/stacktrace-parser/blob/master/src/stack-trace-parser.js

const UNKNOWN_FUNCTION = "<unknown>";

type LineParseResult = null | {
  name: string;
  loc: string | null;
};

function getCallStackLine(depth: number) {
  const stack = String(new Error().stack).split("\n");

  return stack[stack[0] === "Error" ? depth + 1 : depth];
}

export function extractCallLoc(depth: number) {
  const line = getCallStackLine(depth + 3);
  const parsed = line ? parseStackTraceLine(line) : null;

  if (parsed && parsed.loc) {
    return parsed.loc;
  }

  return null;
}

/**
 * This parses the different stack traces and puts them into one format
 * This borrows heavily from TraceKit (https://github.com/csnover/TraceKit)
 */
export function parseStackTrace(stackString: string) {
  const lines = stackString.split("\n");

  return lines.reduce((stack, line) => {
    const parseResult = parseStackTraceLine(line);

    if (parseResult) {
      stack.push(parseResult);
    }

    return stack;
  }, [] as LineParseResult[]);
}

export function parseStackTraceLine(line: string): LineParseResult {
  return parseChrome(line) || parseGecko(line) || parseJSC(line);
}

const chromeRe =
  /^\s*at (.*?) ?\(((?:file|https?|blob|chrome-extension|native|eval|webpack|<anonymous>|\/|[a-z]:\\|\\\\).*?)?\)?\s*$/i;
const chromeRe2 =
  /^\s*at ()((?:file|https?|blob|chrome-extension|native|eval|webpack|<anonymous>|\/|[a-z]:\\|\\\\).*?)\s*$/i;
const chromeEvalRe = /\((\S*)\)/;

function parseChrome(line: string): LineParseResult {
  const parts = chromeRe.exec(line) || chromeRe2.exec(line);

  if (!parts) {
    return null;
  }

  let loc = parts[2];
  const isNative = loc && loc.indexOf("native") === 0; // start of line
  const isEval = loc && loc.indexOf("eval") === 0; // start of line

  const submatch = chromeEvalRe.exec(loc);
  if (isEval && submatch != null) {
    // throw out eval line/column and use top-most line/column number
    loc = submatch[1]; // url
  }

  return {
    loc: !isNative ? parts[2] : null,
    name: parts[1] || UNKNOWN_FUNCTION,
  };
}

const geckoRe =
  /^\s*(.*?)(?:\((.*?)\))?(?:^|@)((?:file|https?|blob|chrome|webpack|resource|\[native).*?|[^@]*bundle)\s*$/i;
const geckoEvalRe = /(\S+) line (\d+)(?: > eval line \d+)* > eval/i;

function parseGecko(line: string): LineParseResult {
  const parts = geckoRe.exec(line);

  if (!parts) {
    return null;
  }

  let loc = parts[3];
  const isEval = loc && loc.indexOf(" > eval") > -1;

  const submatch = geckoEvalRe.exec(loc);
  if (isEval && submatch != null) {
    // throw out eval line/column and use top-most line number
    loc = submatch[1];
  }

  return {
    loc: parts[3],
    name: parts[1] || UNKNOWN_FUNCTION,
  };
}

const javaScriptCoreRe = /^\s*(?:([^@]*)(?:\((.*?)\))?@)?(\S.*?)\s*$/i;

function parseJSC(line: string): LineParseResult {
  const parts = javaScriptCoreRe.exec(line);

  if (!parts) {
    return null;
  }

  return {
    loc: parts[3],
    name: parts[1] || UNKNOWN_FUNCTION,
  };
}
