import React from "./react";
import testCases from "./cases/index";
import createTestCaseWrapper from "./create-test-case-wrapper";
import { createElement } from "./dom-utils";

const reactVersion = new URLSearchParams(location.hash.slice(1)).get("version");
const versions = [
  "17.0.2",
  "17.0.1",
  "17.0.0",
  "16.14.0",
  "16.13.1",
  "16.13.0",
  "16.12.0",
  "16.11.0",
  "16.10.2",
  "16.10.1",
  "16.9.0",
];

function createHash(version: string | null, id: string | null = null) {
  const versionParam = version ? "version=" + encodeURIComponent(version) : "";
  const caseParam = id ? "case=" + id : "";

  return `#${[versionParam, caseParam].filter(Boolean).join("&")}`;
}

function createTocItem(id: string | undefined, title: string) {
  return createElement("li", null, [
    createElement("a", { href: createHash(reactVersion, id) }, title),
  ]);
}

Promise.all(testCases).then(testCases => {
  const testCaseWrappers = testCases.map(test => createTestCaseWrapper(test));

  const headerEl: HTMLElement = document.querySelector(".playground__header");
  const sidebarEl: HTMLElement = document.querySelector(".playground__sidebar");
  const contentEl: HTMLElement = document.querySelector(".playground__content");
  const tocEl = sidebarEl.appendChild(
    createElement("ul", "playground__toc", [createTocItem(undefined, "All")])
  );

  headerEl.append(
    "React version:\xa0",
    createElement(
      "select",
      {
        onchange() {
          location.hash = createHash(this.value, selectedTestCaseId);
        },
      },
      versions.map(version =>
        createElement(
          "option",
          version === reactVersion ? { selected: "" } : {},
          version
        )
      )
    )
  );

  for (const testCaseWrapper of testCaseWrappers) {
    const { id, testcase } = testCaseWrapper;

    tocEl.append(createTocItem(id, testcase.title));
  }

  let selectedTestCaseId = null;
  const renderedTestCases = new Set<ReturnType<typeof createTestCaseWrapper>>();
  const syncSelectedTestCase = () => {
    const params = new URLSearchParams(location.hash.slice(1));
    const newSelectedTestCaseId = params.get("case") || null;
    const newSelectedHash = createHash(reactVersion, newSelectedTestCaseId);

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
      const { id, render, testcase } = testCaseWrapper;
      const { Root, title } = testcase;

      if (selectedTestCaseId !== null && selectedTestCaseId !== id) {
        continue;
      }

      renderedTestCases.add(testCaseWrapper);
      render(contentEl, <Root title={title} />);
    }
  };

  syncSelectedTestCase();
  addEventListener("hashchange", syncSelectedTestCase);
});
// });
