import { createElement } from "./dom-utils.js";
import { TestCase } from "./types.js";

const emulateEventAttribute = "data-send-event";

function emulateEvent(target: HTMLElement) {
  const value = target.getAttribute(emulateEventAttribute);
  switch (value) {
    case "click":
      target.click();
      break;
    default:
      console.warn(
        `Unknown event type "${value}" in "${emulateEventAttribute}" attribute`
      );
  }
}

export default function (testcase: TestCase) {
  let contentEl: HTMLElement;
  let instrumentedEl: HTMLElement;
  let reactEl: HTMLElement;
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

  const observer = new MutationObserver(mutations => {
    for (const mutation of mutations) {
      switch (mutation.type) {
        case "attributes":
          if (mutation.attributeName === emulateEventAttribute) {
            emulateEvent(mutation.target as HTMLElement);
          }
          break;
        case "childList":
          for (const node of mutation.addedNodes) {
            const target = node as HTMLElement;
            if (
              target.nodeType === 1 &&
              target.hasAttribute(emulateEventAttribute)
            ) {
              emulateEvent(target);
            }
          }
          break;
      }
    }
  });
  observer.observe(contentEl, {
    subtree: true,
    childList: true,
    attributes: true,
    attributeFilter: [emulateEventAttribute],
  });

  return {
    container: contentEl,
    instrumentedLog(msg: any) {
      instrumentedEl.append(createElement("div", "log-entry", String(msg)));
    },
    reactLog(msg: any) {
      reactEl.append(createElement("div", "log-entry", String(msg)));
    },
  };
}
