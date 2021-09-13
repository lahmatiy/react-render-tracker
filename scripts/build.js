const esbuild = require("esbuild");

module.exports = {
  buildPlayground,
  buildSubscriber,
  buildPublisher,
};

async function buildPlayground(config) {
  const result = await esbuild.build({
    entryPoints: ["playground/index.tsx"],
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
    // loader: { ".js": "jsx" },
    define: { __CSS__: JSON.stringify(css.outputFiles[0].text) },
    write: false,
    ...config,
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
    format: "esm",
    write: false,
    define: {
      __DEV__: true,
    },
    ...config,
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
