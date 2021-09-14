const express = require("express");
const cors = require("cors");
const path = require("path");
const { buildPublisher, buildSubscriber, buildPlayground } = require("./build");

const app = express();
app.use(cors());
app.use("/dist", express.static(path.join(__dirname, "../dist")));
app.use(express.static(path.join(__dirname, "../playground")));

for (let [url, generator] of Object.entries({
  "/index.js": () => buildPlayground(),
  "/react-render-tracker.js": () => buildPublisher(),
  "/publisher.js": () => buildPublisher(),
  "/subscriber.js": () => buildSubscriber(),
})) {
  app.get(url, asyncResponse(generator));
}

app.listen(process.env.PORT || 3000, function () {
  console.log(`Server listen on ${`http://localhost:${this.address().port}`}`);
});

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
