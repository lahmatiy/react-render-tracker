const { copyFileSync, mkdirSync } = require("fs");
const { buildPlayground, buildBundle } = require("./build");

mkdirSync(".gh-pages", { recursive: true });
copyFileSync("playground/index.html", ".gh-pages/index.html");
copyFileSync("playground/index.css", ".gh-pages/index.css");
buildPlayground({
  logLevel: "info",
  write: true,
  outfile: ".gh-pages/index.js",
});
buildBundle({
  logLevel: "info",
  write: true,
  outfile: ".gh-pages/react-render-tracker.js",
});
