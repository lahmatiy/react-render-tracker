import * as React from "react";
import testCases from "./cases/index.js";
import createTestCaseWrapper from "./create-test-case-wrapper.jsx";
import { RenderContextProvider } from "./helpers.jsx";
import { createElement } from "./dom-utils.js";

function createTocItem(id: string | undefined, title: string) {
  return createElement("li", null, [
    createElement("a", { id, href: `#${id || ""}` }, title),
  ]);
}

Promise.all(testCases).then(testCases => {
  const testCaseWrappers = testCases.map(test => createTestCaseWrapper(test));

  let tocEl: HTMLElement;
  let contentEl: HTMLElement;
  const playgroundEl = createElement("div", "playground", [
    (tocEl = createElement("ul", "playground__toc", [
      createTocItem(undefined, "All"),
    ])),
    (contentEl = createElement("section", "playground__content")),
  ]);

  for (const testCaseWrapper of testCaseWrappers) {
    const { id, testcase } = testCaseWrapper;

    tocEl.append(createTocItem(id, testcase.title));
  }

  document.body.append(playgroundEl);

  let selectedTestCaseId = null;
  const renderedTestCases = new Set<ReturnType<typeof createTestCaseWrapper>>();
  const syncSelectedTestCase = () => {
    const newSelectedTestCaseId = location.hash.slice(1) || null;

    for (const testCaseWrapper of renderedTestCases) {
      renderedTestCases.delete(testCaseWrapper);
      testCaseWrapper.dispose();
    }

    selectedTestCaseId = newSelectedTestCaseId;

    for (const testCaseWrapper of testCaseWrappers) {
      const { id, render, instrumentedLog, testcase } = testCaseWrapper;
      const { Root, title } = testcase;

      if (selectedTestCaseId !== null && selectedTestCaseId !== id) {
        continue;
      }

      renderedTestCases.add(testCaseWrapper);
      render(
        contentEl,
        <RenderContextProvider log={instrumentedLog}>
          <Root title={title} />
        </RenderContextProvider>
      );
    }
  };

  syncSelectedTestCase();
  addEventListener("hashchange", syncSelectedTestCase);
});
