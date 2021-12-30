import * as React from "react";
import ReactDOM from "react-dom";
import { Widget, navButtons, router } from '@discoveryjs/discovery/dist/discovery';
import App from "./App";

// bootstrap HTML document
declare let __CSS__: string;
document.head.appendChild(document.createElement("style")).append(__CSS__);

const rootEl = document.createElement("div");
document.body.appendChild(rootEl);

const discoveryEl = document.createElement("iframe");
discoveryEl.name = 'discovery';
const blob = new Blob(
  ['<html><style>html,body{margin:0;padding:0}</style><body></body></html>'],
  {type : 'text/html'}
);
discoveryEl.src = window.URL.createObjectURL(blob);
document.body.appendChild(discoveryEl);

declare let __DISCOVERY_CSS__: string;

discoveryEl.addEventListener('load', () => {
  if (discoveryEl.contentDocument && discoveryEl.contentWindow) {
    const discovery = new Widget(null, null, {
      styles: [__DISCOVERY_CSS__],
      extensions: [{ ...navButtons, router, loadData: undefined }],
    });

    const wrapper = document.createElement('div');
    wrapper.classList.add('app__discovery-wrapper');
    discoveryEl.contentDocument.body.appendChild(wrapper);

    discovery.setData({}, { name: "React Render Tracker" });
    discovery.setPage("report");
    discovery.setContainer(wrapper);

    discoveryEl.contentWindow.addEventListener('message', ({ data }) => {
      discovery.setData(data.allEvents);
      discoveryEl.style.display = data.discoveryMode ? 'initial' : 'none';
    })
  }
})

// That's actually a hack.
// React add 2x listeners for all known events (one for capture and one for bubbling phases),
// and perform search for a proper fiber and event handlers on it. It turns out that
// on each pointer move there are 4-12 handlers are firing (pointermove & mousemove
// and optionally pointerover, pointerout, mouseover, mouseout). Currently, we don't use
// such event handlers, so avoid adding listeners for them to improve hover performance.
const rootElAddEventListener = rootEl.addEventListener;
rootEl.addEventListener = (
  ...args: Parameters<typeof rootElAddEventListener>
) => {
  if (!/^(pointer|mouse)/.test(args[0])) {
    rootElAddEventListener.call(rootEl, ...args);
  }
};

// render React app
ReactDOM.render(<App />, rootEl);
