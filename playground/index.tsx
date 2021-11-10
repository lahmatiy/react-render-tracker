import * as React from "react";
import testCases from "./cases/index.js";
import createTestCaseWrapper from "./create-test-case-wrapper.jsx";
import { RenderContextProvider } from "./helpers.jsx";
import { createElement } from "./dom-utils.js";

function createTocItem(id: string | undefined, title: string) {
  return createElement("li", null, [
    createElement("a", { href: `#${id || ""}` }, title),
  ]);
}

Promise.all(testCases).then(testCases => {
  const testCaseWrappers = testCases.map(test => createTestCaseWrapper(test));

  const sidebarEl: HTMLElement = document.querySelector(".playground__sidebar");
  const contentEl: HTMLElement = document.querySelector(".playground__content");
  const tocEl = sidebarEl.appendChild(
    createElement("ul", "playground__toc", [createTocItem(undefined, "All")])
  );

  for (const testCaseWrapper of testCaseWrappers) {
    const { id, testcase } = testCaseWrapper;

    tocEl.append(createTocItem(id, testcase.title));
  }

  let selectedTestCaseId = null;
  const renderedTestCases = new Set<ReturnType<typeof createTestCaseWrapper>>();
  const syncSelectedTestCase = () => {
    const newSelectedTestCaseId = location.hash.slice(1) || null;
    const newSelectedHash = `#${newSelectedTestCaseId || ""}`;

    for (const link of tocEl.querySelectorAll("a[href]")) {
      link.classList.toggle(
        "selected",
        link.getAttribute("href") === newSelectedHash
      );
    }

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
