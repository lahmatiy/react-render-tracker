import { SourceMapConsumer } from "source-map-js";

type ChunkStorage = Record<string, () => void>;
type Resolve = (
  line: number,
  column: number
) => ReturnType<typeof SourceMapConsumer.prototype.originalPositionFor>;

const cache = new Map<string, string>();
const knownChunks = new Map<string, number>();
const sourceMaps = new Map<string, { resolve: Resolve }>();

function syncSourceMaps() {
  const webpackChunks = Object.keys(window).filter(key =>
    key.startsWith("webpackChunk_")
  );

  for (const name of webpackChunks) {
    const storage: [any, ChunkStorage][] = (window as { [key: string]: any })[
      name
    ];

    if (!Array.isArray(storage)) {
      continue;
    }

    const knownSize = knownChunks.get(name) || 0;

    for (let i = knownSize; i < storage.length; i++) {
      const storageEntry = storage[i];

      if (
        !Array.isArray(storageEntry) ||
        !storageEntry[1] ||
        typeof storageEntry[1] !== "object"
      ) {
        continue;
      }

      for (const [path, fn] of Object.entries(storageEntry[1])) {
        const [, sourceMapBase64] =
          fn
            .toString()
            .match(/\/\/# sourceMappingURL=.+?;base64,([a-zA-Z0-9\+\/=]+)/) ||
          [];

        if (!sourceMapBase64) {
          continue;
        }

        const resolver = {
          get resolve() {
            let resolve: Resolve = () => ({ source: "", line: 0, column: 0 });

            try {
              const sourceMap = new SourceMapConsumer(
                JSON.parse(atob(sourceMapBase64))
              );
              resolve = (line: number, column: number) =>
                sourceMap.originalPositionFor({ line, column });
            } catch (e) {
              console.warn("[React Render Tracker] Source map parse error:", e);
            }

            Object.defineProperty(resolver, "resolve", { value: resolve });

            return resolve;
          },
        };

        sourceMaps.set(path, resolver);
      }
    }

    knownChunks.set(name, storage.length);
  }
}

export function resolveSourceLoc(loc: string | null) {
  if (loc === null) {
    return null;
  }

  loc = loc.replace(/^webpack-internal:\/\/\//, "");

  if (cache.has(loc)) {
    return cache.get(loc) as string;
  }

  const [, filepath, rawLine, rawColumn] =
    loc.match(/^(.+?)(?::(\d+)(?::(\d+))?)?$/) || [];
  const genLine = rawLine ? parseInt(rawLine, 10) : 0;
  const genColumn = rawColumn ? parseInt(rawColumn, 10) : 0;

  syncSourceMaps();

  const sourceMap = sourceMaps.get(filepath);
  if (sourceMap) {
    const mappedPos = sourceMap.resolve(genLine, genColumn);

    if (mappedPos !== null && mappedPos.source) {
      const { source, line, column } = mappedPos;

      return `${source
        .replace(/^webpack:\/\//, "")
        .replace(/\?.*$/, "")}:${line}:${column}`;
    }
  }

  return loc;
}
