const express = require("express");
const path = require("path");
const { buildPublisher, buildSubscriber, buildPlayground } = require("./build");

const app = express();
app.use(express.static(path.join(__dirname, "../playground")));
app.get(
  "/index.js",
  asyncResponse(() => buildPlayground())
);
app.get(
  "/publisher.js",
  asyncResponse(() => buildPublisher())
);
app.get(
  "/subscriber.js",
  asyncResponse(() => buildSubscriber())
);
app.listen(3000, function () {
  console.log(`Server listen on ${`http://localhost:${this.address().port}`}`);
});

function asyncResponse(asyncFn, contentType = "text/javascript") {
  return async (req, res) => {
    const content = await asyncFn();
    res.type(contentType);
    res.end(content);
  };
}
