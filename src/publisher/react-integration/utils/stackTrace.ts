// Adopted version of StackTrace-Parser
// https://github.com/errwischt/stacktrace-parser/blob/master/src/stack-trace-parser.js

const UNKNOWN_FUNCTION = "<unknown>";
const hasOwn =
  Object.hasOwn ||
  ((target, prop) => Object.prototype.hasOwnProperty.call(target, prop));

type LineParseResult = null | {
  name: string;
  loc: string | null;
};

function lazyParseArray<T extends string | NodeJS.CallSite>(
  array: T[],
  parse: (val: T) => LineParseResult
) {
  const cache: LineParseResult[] = [];

  return new Proxy(array, {
    get(target, prop) {
      if (typeof prop === "string") {
        const index = Number(prop);

        if (isFinite(index) && hasOwn(array, prop)) {
          // Check if the value at the index is already parsed
          if (typeof cache[index] === "undefined") {
            cache[index] = parse(array[index]);
          }

          return cache[index];
        }
      }

      return (target as any)[prop];
    },
  });
}

export function extractCallLoc(depth: number) {
  const parsed = getParsedStackTrace()[depth + 2];

  if (parsed && parsed.loc) {
    return parsed.loc;
  }

  return null;
}

export function getParsedStackTrace(skip = 1, limit = 25) {
  const prevPrepareStackTrace = Error.prepareStackTrace;
  const prevStackTraceLimit = Error.stackTraceLimit;

  try {
    Error.stackTraceLimit = limit;
    Error.prepareStackTrace = (_, callSites) => {
      result = lazyParseArray(callSites.slice(skip), parseCallSite);

      return "";
    };

    let result: NodeJS.CallSite[] | string[] | null = null;
    const stack = new Error().stack;

    if (result === null && stack) {
      const lines = stack.trim().split("\n");

      result = lazyParseArray(
        lines.slice(lines[0] === "Error" ? skip + 1 : skip),
        parseStackTraceLine
      );
    }

    return (result || []) as unknown as LineParseResult[]; // TS doesn't handle Proxy right
  } finally {
    Error.stackTraceLimit = prevStackTraceLimit;
    Error.prepareStackTrace = prevPrepareStackTrace;
  }
}

function parseCallSite(
  callSite: NodeJS.CallSite & { getScriptNameOrSourceURL?: () => string | null }
) {
  const filename =
    typeof callSite.getScriptNameOrSourceURL === "function"
      ? callSite.getScriptNameOrSourceURL()
      : callSite.getFileName();

  return {
    loc: filename
      ? `${filename}:${callSite.getLineNumber()}:${callSite.getColumnNumber()}`
      : null,
    name: callSite.getFunctionName() || UNKNOWN_FUNCTION,
  };
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
