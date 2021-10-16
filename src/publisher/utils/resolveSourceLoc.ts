import { SourceMapConsumer } from "source-map-js";

type ChunkStorage = Record<string, () => void>;
type Resolve = (
  loc: string,
  line: number,
  column: number
) => string | Promise<string>;

const cache = new Map<string, string | Promise<string>>();
const knownWebpackChunks = new Map<string, number>();
const sourceMapsResolve = new Map<string, Resolve | null>();
const noResolve = (loc: string) => {
  cache.set(loc, loc);
  return loc;
};
let needWebpackSync = true;

function sourceToResolve(filepath: string, source: string | (() => any)) {
  const lazyResolve = (loc: string, line: number, column: number) => {
    const [, sourceMapBase64] =
      String(source).match(
        /\/\/# sourceMappingURL=.+?;base64,([a-zA-Z0-9\+\/=]+)/
      ) || [];
    let resolve: Resolve = noResolve;

    if (sourceMapBase64) {
      try {
        const sourceMap = new SourceMapConsumer(
          JSON.parse(atob(sourceMapBase64))
        );

        resolve = (loc: string, line: number, column: number) => {
          const {
            source,
            line: origLine,
            column: origColumn,
          } = sourceMap.originalPositionFor({
            line,
            column,
          });
          const resolvedLoc = source
            ? `${source
                .replace(/^webpack:\/\//, "")
                .replace(/\?.*$/, "")}:${origLine}:${origColumn}`
            : loc;

          cache.set(loc, resolvedLoc);

          return resolvedLoc;
        };
      } catch (e) {
        console.warn("[React Render Tracker] Source map parse error:", e);
      }
    }

    sourceMapsResolve.set(filepath, resolve);

    return resolve ? resolve(loc, line, column) : loc;
  };

  sourceMapsResolve.set(filepath, lazyResolve);

  return lazyResolve;
}

function asyncSourceToResolve(
  filepath: string,
  sourcePromise: Promise<string>
) {
  const promiseResolve = sourcePromise
    .then(source => sourceToResolve(filepath, source))
    .catch(() => {
      sourceMapsResolve.set(filepath, noResolve);
      return noResolve;
    });

  sourceMapsResolve.set(
    filepath,
    (loc: string, line: number, column: number) => {
      const resolvedLoc = promiseResolve.then(resolve =>
        resolve(loc, line, column)
      );

      cache.set(loc, resolvedLoc);

      return resolvedLoc;
    }
  );
}

function syncWebpackSourceMapsIfNeeded() {
  if (!needWebpackSync) {
    return;
  }

  needWebpackSync = false;
  requestIdleCallback(() => (needWebpackSync = true));

  for (const name of Object.keys(window)) {
    if (!name.startsWith("webpackChunk_")) {
      continue;
    }

    const knownSize = knownWebpackChunks.get(name) || 0;
    const storage: [any, ChunkStorage][] = (window as { [key: string]: any })[
      name
    ];

    if (!Array.isArray(storage)) {
      continue;
    }

    for (let i = knownSize; i < storage.length; i++) {
      const storageEntry = storage[i];

      if (
        Array.isArray(storageEntry) &&
        storageEntry[1] &&
        typeof storageEntry[1] === "object"
      ) {
        for (const [filepath, fn] of Object.entries(storageEntry[1])) {
          sourceToResolve(filepath, fn);
        }
      }
    }

    knownWebpackChunks.set(name, storage.length);
  }
}

function fetchIfNeeded(filepath: string) {
  if (!sourceMapsResolve.has(filepath)) {
    asyncSourceToResolve(
      filepath,
      fetch(filepath).then(res => res.text())
    );
  }
}

export function resolveSourceLoc(loc: string) {
  const cachedValue = cache.get(loc);

  if (cachedValue !== undefined) {
    return cachedValue;
  }

  const [, filepath, rawLine, rawColumn] =
    loc
      .replace(/^webpack-internal:\/\/\//, "")
      .match(/^(.+?)(?::(\d+)(?::(\d+))?)?$/) || [];
  const genLine = rawLine ? parseInt(rawLine, 10) : 0;
  const genColumn = rawColumn ? parseInt(rawColumn, 10) : 0;

  syncWebpackSourceMapsIfNeeded();
  fetchIfNeeded(filepath);

  const resolve = sourceMapsResolve.get(filepath) || noResolve;

  return resolve(loc, genLine, genColumn);
}
