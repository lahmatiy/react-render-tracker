const esbuild = require("esbuild");

module.exports = {
  buildPlayground,
  buildSubscriber,
  buildPublisher,
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
    entryPoints: ["playground/index.tsx"],
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
    entryPoints: ["src/ui/index.css"],
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
    entryPoints: ["src/ui/index.tsx"],
    bundle: true,
    sourcemap: true,
    format: "esm",
    write: false,
    ...config,
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
    entryPoints: ["src/publisher/index.ts"],
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

if (require.main === module) {
  (async () => {
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
    buildPublisher({
      logLevel: "info",
      write: true,
      outfile: "dist/react-render-tracker.js",
      format: "iife",
      minify: true,
      sourcemap: false,
      define: {
        __DEV__: false,
        __SUBSCRIBER_SRC__: JSON.stringify(__SUBSCRIBER_SRC__),
      },
    });
  })();
}
