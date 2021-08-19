import ReactDOM from "react-dom";
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
  let reactRootEl: HTMLElement;
  let instrumentedLogEl: HTMLElement;
  let reactLogEl: HTMLElement;
  const rootEl = createElement("div", "case-wrapper", [
    createElement("h2", null, testcase.title),
    (reactRootEl = createElement("div", "content")),
    createElement("div", "instrumented-log", [
      createElement("h3", null, "Instrumented log"),
      (instrumentedLogEl = createElement("div", "log")),
    ]),
    createElement("div", "react-log", [
      createElement("h3", null, "React log"),
      (reactLogEl = createElement("div", "log")),
    ]),
  ]);

  let observing = false;
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

  return {
    id: encodeURIComponent(testcase.title.replace(/\s+/g, "-")),
    testcase,
    instrumentedLog(msg: any) {
      instrumentedLogEl.append(createElement("div", "log-entry", String(msg)));
    },
    reactLog(msg: any) {
      reactLogEl.append(createElement("div", "log-entry", String(msg)));
    },
    render(containerEl: HTMLElement, element: JSX.Element) {
      if (!containerEl.contains(rootEl)) {
        containerEl.append(rootEl);
      }

      if (!observing) {
        observing = true;
        observer.observe(reactRootEl, {
          subtree: true,
          childList: true,
          attributes: true,
          attributeFilter: [emulateEventAttribute],
        });
      }

      ReactDOM.render(element, reactRootEl);
    },
    dispose() {
      observing = false;
      observer.disconnect();
      ReactDOM.unmountComponentAtNode(reactRootEl);
      rootEl.remove();
      instrumentedLogEl.innerHTML = "";
      reactLogEl.innerHTML = "";
    },
  };
}
