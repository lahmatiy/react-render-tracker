import { createElement } from "./dom-utils.js";
import { TestCase } from "./types.js";

export default function (testcase: TestCase) {
  let contentEl;
  let instrumentedEl;
  let reactEl;
  const el = createElement("div", "case-wrapper", [
    createElement("h2", null, testcase.title),
    (contentEl = createElement("div", "content")),
    createElement("div", "instrumented-log", [
      createElement("h3", null, "Instrumented log"),
      (instrumentedEl = createElement("div", "log")),
    ]),
    createElement("div", "react-log", [
      createElement("h3", null, "React log"),
      (reactEl = createElement("div", "log")),
    ]),
  ]);

  document.body.append(el);

  return {
    container: contentEl,
    instrumentedLog(msg) {
      instrumentedEl.append(createElement("div", "log-entry", String(msg)));
    },
    reactLog(msg) {
      reactEl.append(createElement("div", "log-entry", String(msg)));
    },
  };
}
