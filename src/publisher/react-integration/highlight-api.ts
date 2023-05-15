import { HighlighterEvent } from "rempl";
import type { ReactDevtoolsHook } from "../react-devtools-hook";
import Overlay from "../overlay";
import Highlighter from "../highlighter";

let overlay: Overlay | null = null;
let highlighter: Highlighter | null = null;

export function createHighlightApi(
  hook: ReactDevtoolsHook,
  publish: (event: HighlighterEvent) => void,
) {

  const startHighlight = (fiberId: number, name: string) => {
    let nodes = hook.rendererInterfaces.get(1).findNativeNodesForFiberID(fiberId)
    if (!nodes || !nodes.length) {
      return;
    }

    nodes = nodes.filter(node => node.nodeType === 1);

    if (nodes.length) {

      if (!overlay) {
        overlay = new Overlay(hook);
      }

      overlay.inspect(nodes, name);
    }
  };

  const stopHighlight = () => {
    if (overlay) {
      overlay.remove();
      overlay = null;
    }
  };

  const startInspect = () => {
    if (!overlay) {
      overlay = new Overlay(hook);
    }
    if (!highlighter) {
      highlighter = new Highlighter(
        hook,
        overlay,
        publish,
      );
    }

    highlighter.startInspect();
  }

  const stopInspect = () => {
    if (highlighter) {
      highlighter.stopInspect();
      highlighter = null;
    }
    if (overlay) {
      overlay.remove();
      overlay = null;
    }
  }

  return {
    startHighlight,
    stopHighlight,
    startInspect,
    stopInspect,
  }
}
