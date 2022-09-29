/* eslint-disable @typescript-eslint/no-non-null-assertion */
import React from "./react";
import testCases from "./cases/index";
import createTestCaseWrapper from "./create-test-case-wrapper";
import { createElement } from "./dom-utils";

const initialHashParams = new URLSearchParams(location.hash.slice(1));
const reactVersion = initialHashParams.get("version");
const bundleTypeParam = initialHashParams.get("bundle-type");
const bundleType =
  bundleTypeParam === "production"
    ? "production"
    : bundleTypeParam === "profiling"
    ? "profiling"
    : "development";
const bundleTypes: typeof bundleType[] = [
  "development",
  "production",
  "profiling",
];
const versions = [
  "18.2.0",
  "18.1.0",
  "18.0.0",
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

function createHash(
  version: string | null,
  bundleType: "development" | "production" | "profiling",
  id: string | null = null
) {
  const params = new URLSearchParams();

  if (version) {
    params.append("version", version);
  }

  if (bundleType && bundleType !== "development") {
    params.append("bundle-type", bundleType);
  }

  if (id) {
    params.append("case", id);
  }

  return `#${params}`;
}

function createTocItem(id: string | undefined, title: string) {
  return createElement("li", null, [
    createElement(
      "a",
      { href: createHash(reactVersion, bundleType, id) },
      title
    ),
  ]);
}

function selectElement(selector: string): HTMLElement {
  return document.querySelector(selector)!;
}

Promise.all(testCases).then(testCases => {
  const testCaseWrappers = testCases.map(test => createTestCaseWrapper(test));

  const headerEl = selectElement(".playground__header");
  const sidebarEl = selectElement(".playground__sidebar");
  const contentEl = selectElement(".playground__content");
  const tocEl = sidebarEl.appendChild(
    createElement("ul", "playground__toc", [createTocItem(undefined, "All")])
  );

  headerEl.append(
    "React version:\xa0",
    createElement(
      "select",
      {
        onchange() {
          location.hash = createHash(
            this.value,
            bundleType,
            selectedTestCaseId
          );
        },
      },
      versions.map(version =>
        createElement(
          "option",
          version === reactVersion ? { selected: "" } : {},
          version
        )
      )
    ),
    createElement(
      "select",
      {
        onchange() {
          location.hash = createHash(
            reactVersion,
            this.value as typeof bundleType,
            selectedTestCaseId
          );
        },
      },
      bundleTypes.map(type =>
        createElement(
          "option",
          type === bundleType ? { selected: "" } : {},
          type
        )
      )
    )
  );

  for (const testCaseWrapper of testCaseWrappers) {
    const { id, testcase } = testCaseWrapper;

    tocEl.append(createTocItem(id, testcase.title));
  }

  let selectedTestCaseId: string | null = null;
  const renderedTestCases = new Set<ReturnType<typeof createTestCaseWrapper>>();
  const syncSelectedTestCase = () => {
    const params = new URLSearchParams(location.hash.slice(1));
    const newSelectedTestCaseId = params.get("case") || null;
    const newSelectedHash = createHash(
      reactVersion,
      bundleType,
      newSelectedTestCaseId
    );

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

      if (
        selectedTestCaseId !== null &&
        selectedTestCaseId !== decodeURIComponent(id)
      ) {
        continue;
      }

      renderedTestCases.add(testCaseWrapper);
      render(contentEl, <Root title={title} />);
    }
  };

  syncSelectedTestCase();
  addEventListener("hashchange", syncSelectedTestCase);
});
