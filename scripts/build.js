const esbuild = require("esbuild");

exports.buildPlayground = async function (config) {
  const result = await esbuild.buildSync({
    entryPoints: ["playground/index.tsx"],
    // external: ["src/*"],
    bundle: true,
    sourcemap: true,
    // keepNames: true,
    format: "esm",
    write: false,
    ...config,
  });

  if (result.outputFiles && result.outputFiles.length) {
    return result.outputFiles[0].text;
  }
};

exports.buildSubscriber = async function (config, configCSS) {
  const css = await esbuild.buildSync({
    entryPoints: ["src/ui/index.css"],
    bundle: true,
    sourcemap: true,
    loader: {
      ".png": "dataurl",
      ".svg": "dataurl",
    },
    ...configCSS,
    write: false,
  });
  const result = await esbuild.buildSync({
    entryPoints: ["src/ui/index.tsx"],
    bundle: true,
    sourcemap: true,
    format: "esm",
    loader: { ".js": "jsx" },
    define: { __CSS__: JSON.stringify(css.outputFiles[0].text) },
    write: false,
    ...config,
  });

  if (result.outputFiles && result.outputFiles.length) {
    return result.outputFiles[0].text;
  }
};

exports.buildPublisher = async function (config) {
  const result = await esbuild.buildSync({
    entryPoints: ["src/publisher/index.ts"],
    bundle: true,
    sourcemap: true,
    format: "esm",
    write: false,
    ...config,
  });

  if (result.outputFiles && result.outputFiles.length) {
    return result.outputFiles[0].text;
  }
};

if (require.main === module) {
  exports.buildPlayground({
    write: true,
    outdir: "dist",
  });
}
