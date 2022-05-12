const esbuild = require("esbuild");
const express = require("express");
const server = express();

function asyncResponse(asyncFn, contentType = "text/javascript") {
  return async (req, res) => {
    // console.log("request", req.url);
    try {
      const content = await asyncFn();

      res.type(contentType);
      res.send(content);
      res.end();
    } catch (e) {
      res.status(500);
      res.end(e.message);
    }
  };
}

exports.startAppServer = function (options) {
  options = options || {};

  const port = options.port || 0;

  server.use(express.static(__dirname + "/src"));
  for (let [url, generator] of Object.entries({
    "/app.js": async () => {
      const bundle = await esbuild.build({
        entryPoints: [__dirname + "/src/index.jsx"],
        bundle: true,
        // minify: true, // React Render Tracker currently doesn't support for a production version of React
        format: "esm",
        write: false,
      });

      return bundle.outputFiles[0].text;
    },
  })) {
    server.get(url, asyncResponse(generator));
  }

  return new Promise(resolve => {
    server.listen(port, async function () {
      const host = `http://localhost:${this.address().port}`;

      console.log(`Server listen on ${host}`);
      console.log();

      resolve({
        host,
        close: () => this.close(),
      });
    });
  });
};

if (require.main === module) {
  exports.startAppServer({ port: 3111 });
}
