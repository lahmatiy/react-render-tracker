const { copyFileSync, mkdirSync } = require("fs");
const { buildPlayground, buildBundle, buildDataClient } = require("./build");

mkdirSync(".gh-pages", { recursive: true });
copyFileSync("playground/index.html", ".gh-pages/index.html");
copyFileSync("playground/index.css", ".gh-pages/index.css");
copyFileSync(
  "playground/data-client-example.js",
  ".gh-pages/data-client-example.js"
);
build(buildPlayground, ".gh-pages/index.js");
build(buildBundle, ".gh-pages/react-render-tracker.js");
build(buildDataClient, ".gh-pages/rrt-data-client.js");

function build(subject, outfile) {
  subject({
    logLevel: "info",
    write: true,
    outfile,
  });
}
