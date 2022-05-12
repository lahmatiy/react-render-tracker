import ReactDOM from "./react-dom";
import { createElement } from "./dom-utils";
import { TestCase } from "./types";

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
  let reactRoot: any;
  let reactRootEl: HTMLElement;
  const rootEl = createElement("div", "case-wrapper", [
    createElement("h2", null, [createElement("span", null, testcase.title)]),
    (reactRootEl = createElement("div", {
      id: testcase.title,
      class: "content",
    })),
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
          for (const node of Array.from(mutation.addedNodes)) {
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

      if ((ReactDOM as any).createRoot) {
        // React 18
        reactRoot = (ReactDOM as any).createRoot(reactRootEl);
        reactRoot.render(element);
      } else {
        // React prior 18
        ReactDOM.render(element, reactRootEl);
      }
    },
    dispose() {
      observing = false;
      observer.disconnect();
      if (reactRoot) {
        reactRoot.unmount();
      } else {
        ReactDOM.unmountComponentAtNode(reactRootEl);
      }
      rootEl.remove();
    },
  };
}
