const express = require("express");
const cors = require("cors");
const path = require("path");
const fs = require("fs");
const openInEditor = require("express-open-in-editor");
const { buildPublisher, buildSubscriber, buildPlayground } = require("./build");
const playgroundDir = path.join(__dirname, "../playground");

const app = express();
app.use(cors());
app.get("/", html(path.join(playgroundDir, "index.html")));
app.get("/index.html", html(path.join(playgroundDir, "index.html")));
app.use("/dist", express.static(path.join(__dirname, "../dist")));
app.get("/open-in-editor", openInEditor());
app.use(express.static(playgroundDir));

app.listen(process.env.PORT || 3000, function () {
  const host = `http://localhost:${this.address().port}`;

  console.log(`Server listen on ${host}`);
  for (let [url, generator] of Object.entries({
    "/index.js": () => buildPlayground(),
    "/react-render-tracker.js": () =>
      buildPublisher({ define: { "import.meta.url": JSON.stringify(host) } }),
    "/publisher.js": () =>
      buildPublisher({ define: { "import.meta.url": JSON.stringify(host) } }),
    "/subscriber.js": () => buildSubscriber(),
  })) {
    app.get(url, asyncResponse(generator));
  }
});

function html(filepath) {
  return (req, res) => {
    res.type("text/html");
    res.send(
      fs.readFileSync(filepath, "utf8").replace(/\{cwd\}/g, process.cwd())
    );
    res.end();
  };
}

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
