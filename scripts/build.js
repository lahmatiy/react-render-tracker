const esbuild = require("esbuild");
const path = require("path");
const basePath = path.join(__dirname, "..");

module.exports = {
  buildPlayground,
  buildDataUtils,
  buildSubscriber,
  buildSelfSubscriber: buildDataClient,
  buildPublisher,
  buildBundle,
};

async function buildPlayground(config) {
  const plugins = [
    {
      name: "replace",
      setup({ onLoad }) {
        onLoad({ filter: /react\.tsx/ }, () => ({
          contents: `export default window.React;`,
        }));
        onLoad({ filter: /react-dom\.tsx/ }, () => ({
          contents: `export default window.ReactDOM;`,
        }));
      },
    },
  ];

  const result = await esbuild.build({
    entryPoints: [path.join(basePath, "playground/index.tsx")],
    plugins,
    // external: ["src/*"],
    bundle: true,
    sourcemap: true,
    keepNames: true,
    format: "esm",
    write: false,
    ...config,
  });

  if (result.outputFiles && result.outputFiles.length) {
    return result.outputFiles[0].text;
  }
}

async function buildSubscriber(config, configCSS) {
  const css = await esbuild.build({
    entryPoints: [path.join(basePath, "src/ui/index.css")],
    bundle: true,
    loader: {
      ".png": "dataurl",
      ".svg": "dataurl",
    },
    sourcemap: true,
    ...configCSS,
    write: false,
  });
  const result = await esbuild.build({
    entryPoints: [path.join(basePath, "src/ui/index.tsx")],
    bundle: true,
    sourcemap: true,
    format: "esm",
    write: false,
    ...config,
    plugins: [
      {
        // FIXME: That's a temporary fix.
        // Subscriber doesn't use for socket.io-client, however esbuild doesn't cut off it
        // since it is CommonJS module. Migration from socket.io v2 to v4 should potentially
        // fix the issue since v4 uses ESM
        name: "cut-off-subscriber",
        setup({ onLoad }) {
          onLoad({ filter: /socket\.io-client/ }, () => ({
            contents: "export default {}",
          }));
        },
      },
      ...((config && config.plugins) || []),
    ],
    define: {
      ...(config && config.define),
      __CSS__: JSON.stringify(css.outputFiles[0].text),
      // "process.env.NODE_ENV": '"production"',
    },
  });

  if (result.outputFiles && result.outputFiles.length) {
    return result.outputFiles[0].text;
  }
}

async function buildPublisher(config) {
  const result = await esbuild.build({
    entryPoints: [path.join(basePath, "src/publisher/index.ts")],
    bundle: true,
    sourcemap: true,
    format: "iife",
    write: false,
    ...config,
    define: {
      __DEV__: true,
      ...(config && config.define),
    },
  });

  if (result.outputFiles && result.outputFiles.length) {
    return result.outputFiles[0].text;
  }
}

async function buildDataUtils(config) {
  config = config || {};

  if (!config.outfile && config.write) {
    config.outfile = path.join(basePath, "dist/data-utils.js");
  }

  const result = await esbuild.build({
    entryPoints: [path.join(basePath, "src/data/index.ts")],
    bundle: true,
    format: "esm",
    write: false,
    ...config,
    define: {
      __DEV__: true,
      ...(config && config.define),
    },
  });

  if (result.outputFiles && result.outputFiles.length) {
    return result.outputFiles[0].text;
  }
}

async function buildDataClient(config) {
  config = config || {};

  if (!config.outfile && config.write) {
    config.outfile = path.join(basePath, "dist/data-client.js");
  }

  const result = await esbuild.build({
    entryPoints: [path.join(basePath, "src/data-client/index.ts")],
    bundle: true,
    minify: true,
    format: "esm",
    write: false,
    ...config,
    define: {
      __DEV__: true,
      ...(config && config.define),
    },
  });

  if (result.outputFiles && result.outputFiles.length) {
    return result.outputFiles[0].text;
  }
}

async function buildBundle(config) {
  config = config || {};

  if (!config.outfile && config.write) {
    config.outfile = path.join(basePath, "dist/react-render-tracker.js");
  }

  const __SUBSCRIBER_SRC__ = await buildSubscriber(
    {
      minify: true,
      sourcemap: false,
    },
    {
      minify: true,
      sourcemap: false,
    }
  );

  return await buildPublisher({
    format: "iife",
    minify: true,
    sourcemap: false,
    ...config,
    define: {
      __DEV__: false,
      __SUBSCRIBER_SRC__: JSON.stringify(__SUBSCRIBER_SRC__),
      ...(config && config.define),
    },
  });
}

function buildHeadlessBrowserModules(config) {
  return Promise.all([
    esbuild.build({
      entryPoints: [path.join(basePath, "src/data-client/headless-browser.ts")],
      outfile: path.join(basePath, "dist/headless-browser-client.mjs"),
      format: "esm",
      bundle: false,
      ...config,
      banner: {
        js: 'import { fileURLToPath } from "url";\nconst __dirname = path.dirname(fileURLToPath(import.meta.url));\n',
      },
    }),
    esbuild.build({
      entryPoints: [path.join(basePath, "src/data-client/headless-browser.ts")],
      outfile: path.join(basePath, "dist/headless-browser-client.js"),
      format: "cjs",
      bundle: false,
      ...config,
    }),
  ]);
}

if (require.main === module) {
  (async () => {
    await buildBundle({ logLevel: "info", write: true });
    await buildDataClient({ logLevel: "info", write: true });
    await buildDataUtils({ logLevel: "info", write: true });
    await buildHeadlessBrowserModules({ logLevel: "info" });
  })();
}
