// Adopted version of StackTrace-Parser
// https://github.com/errwischt/stacktrace-parser/blob/master/src/stack-trace-parser.js

const UNKNOWN_FUNCTION = "<unknown>";
const hasOwn =
  Object.hasOwn ||
  ((target, prop) => Object.prototype.hasOwnProperty.call(target, prop));

type LineParseResult = null | {
  name: string;
  loc: string | null;
  evalOrigin: string | null;
  evalLoc: string | null;
  evalMaybeSourceUrl: string | null;
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
            const res = parse(array[index]);

            if (
              res &&
              res.loc === null &&
              res.evalMaybeSourceUrl &&
              /[.\/\\]/.test(res.evalMaybeSourceUrl)
            ) {
              res.loc = `${res.evalMaybeSourceUrl}${res.evalLoc || ""}`;
            }

            cache[index] = res;
          }

          return cache[index];
        }
      }

      return (target as any)[prop];
    },
  }) as unknown as LineParseResult[];
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

    let result: LineParseResult[] | null = null;
    const stack = new Error().stack;

    if (result === null && stack) {
      const lines = stack.trim().split("\n");

      result = lazyParseArray(
        lines.slice(lines[0] === "Error" ? skip + 1 : skip),
        parseStackTraceLine
      );
    }

    return [...(result || [])];
  } finally {
    Error.stackTraceLimit = prevStackTraceLimit;
    Error.prepareStackTrace = prevPrepareStackTrace;
  }
}

function buildLoc(line: number | null, column: number | null) {
  let res = "";

  if (line !== null) {
    res = ":" + line;
    if (column !== null) {
      res += ":" + column;
    }
  }

  return res;
}

function getLocFromCallSite(
  callSite: NodeJS.CallSite & { getScriptNameOrSourceURL?: () => string | null }
) {
  const filename =
    typeof callSite.getScriptNameOrSourceURL === "function"
      ? callSite.getScriptNameOrSourceURL()
      : callSite.getFileName?.();

  return filename
    ? `${filename}${buildLoc(
        callSite.getLineNumber(),
        callSite.getColumnNumber()
      )}`
    : null;
}

function parseCallSite(
  callSite: NodeJS.CallSite & { getScriptNameOrSourceURL?: () => string | null }
) {
  const callSiteEvalOrigin = callSite.getEvalOrigin();
  let loc = getLocFromCallSite(callSite);
  let functionName = callSite.getFunctionName();
  let evalOrigin = null;
  let evalLoc = null;
  let evalMaybeSourceUrl = null;

  if (functionName !== null && functionName.includes(".")) {
    const typeName = callSite.getTypeName();
    const methodName = callSite.getMethodName();

    if (typeName && methodName) {
      functionName = `${typeName}#${methodName}`;
    } else {
      functionName = functionName.replace(/.*?\.([^\.]+(?:\.[^\.]+)?)$/, "$1");
    }
  }

  if (
    typeof callSiteEvalOrigin === "string" &&
    callSiteEvalOrigin.startsWith("eval at")
  ) {
    const evalOriginParseResult = parseChrome(callSiteEvalOrigin.slice(5));

    if (evalOriginParseResult) {
      evalOrigin = evalOriginParseResult.loc;
      evalMaybeSourceUrl = evalOriginParseResult.name;
      evalLoc =
        buildLoc(callSite.getLineNumber(), callSite.getColumnNumber()) || null;
      loc = null;
    }
  }

  return {
    loc,
    name: functionName || UNKNOWN_FUNCTION,
    evalOrigin,
    evalLoc,
    evalMaybeSourceUrl,
    // dump: Object.getOwnPropertyNames(callSite.constructor.prototype).reduce(
    //   (dump, k) => {
    //     if (/^(is|get)/.test(k)) {
    //       dump[k] = callSite[k]();
    //     }
    //     return dump;
    //   },
    //   {}
    // ),
  };
}

export function parseStackTraceLine(line: string): LineParseResult {
  return parseChrome(line) || parseGecko(line) || parseJSC(line);
}

const chromeRe = /^\s*at (.*?)\s*\((.*?)\)?\s*$/i;
const chromeRefRx =
  /^(?:eval at|file|https?|blob|chrome-extension|native|eval|webpack|<anonymous>|\.{0,2}\/|[a-z]:\\|\\\\)/;
const chromeEvalRe = /\((\S*)\)/;

function parseChrome(line: string): LineParseResult {
  const parts = chromeRe.exec(line);

  if (!parts) {
    return null;
  }

  const ref = parts[2];

  if (!chromeRefRx.test(ref)) {
    return null;
  }

  let loc = parts[2] || null;
  let evalOrigin = null;
  let evalMaybeSourceUrl = null;
  let evalLoc = null;

  if (loc) {
    if (loc.startsWith("native")) {
      loc = null;
    } else {
      const isEval = loc && loc.startsWith("eval"); // start of line

      if (loc.startsWith("eval at")) {
        const innerLoc = loc.match(/(?:,\s*\S+)?(:\d+:\d+)$/);
        const inner = parseChrome(
          loc.slice(5, innerLoc ? -innerLoc[0].length : undefined)
        );

        if (inner !== null) {
          evalOrigin = inner.loc;
          evalLoc = innerLoc?.[1] || null;
          evalMaybeSourceUrl = inner.name;
          loc = null;
        }
      } else {
        const submatch = chromeEvalRe.exec(loc);
        if (isEval && submatch != null) {
          // throw out eval line/column and use top-most line/column number
          loc = submatch[1]; // url
        }
      }
    }
  }

  return {
    loc,
    name: parts[1] || UNKNOWN_FUNCTION,
    evalOrigin,
    evalLoc,
    evalMaybeSourceUrl,
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

  let name = parts[1];
  let loc = parts[3];
  const isEval = loc && loc.indexOf(" > eval") > -1;

  const submatch = geckoEvalRe.exec(loc);
  if (isEval && submatch != null) {
    // throw out eval line/column and use top-most line number
    loc = submatch[1];
  }

  if (name && name.includes("/")) {
    name = name.replace(/^.*\/([^\/]+)$/, "$1").replace(/\.prototype\./, "#");
  }

  return {
    loc: parts[3],
    name: name || UNKNOWN_FUNCTION,
    evalOrigin: null,
    evalLoc: null,
    evalMaybeSourceUrl: null,
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
    evalLoc: null,
    evalOrigin: null,
    evalMaybeSourceUrl: null,
  };
}
