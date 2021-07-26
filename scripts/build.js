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

  if (result.outputFiles?.length) {
    return result.outputFiles[0].text;
  }
};

exports.buildSubscriber = async function (config) {
  const result = await esbuild.buildSync({
    entryPoints: ["src/ui/index.js"],
    bundle: true,
    format: "esm",
    write: false,
    ...config,
  });

  if (result.outputFiles?.length) {
    return result.outputFiles[0].text;
  }
};

exports.buildPublisher = async function (config) {
  const result = await esbuild.buildSync({
    entryPoints: ["src/index.js"],
    bundle: true,
    sourcemap: true,
    format: "esm",
    write: false,
    ...config,
  });

  if (result.outputFiles?.length) {
    return result.outputFiles[0].text;
  }
};

if (require.main === module) {
  exports.buildPlayground({
    write: true,
    outdir: "dist",
  });
}
