import * as React from "react";
import ReactDOM from "react-dom";
import testCases from "./cases/index.js";
import createTestCaseWrapper from "./create-test-case-wrapper.jsx";
import rempl from "rempl";
import { RenderContextProvider } from "./helpers.jsx";

Promise.all(testCases).then(testCases => {
  for (const test of testCases) {
    const { container, instrumentedLog } = createTestCaseWrapper(test);
    const { Root, title } = test;

    ReactDOM.render(
      <RenderContextProvider log={instrumentedLog}>
        <Root title={title} />
      </RenderContextProvider>,
      container
    );
  }
});

// NOTE: That's not a part of demo, and helps to try Rempl in action with zero setup.
// Although host is running inside page (btw, it calls in-page host) it load subscriber's UI
// into <iframe>. So actually publisher and subcriber communicate cross runtimes through
// event-based transport.
rempl.getHost().activate();
