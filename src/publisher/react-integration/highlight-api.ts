import { HighlightState } from "rempl";
import Overlay from "../overlay";
import { NativeType, ReactInterationApi } from "../types";

type StateChangeHandler = (state: HighlightState) => void;
type StateSubscriber = { fn: StateChangeHandler };

export function createHighlightApi({
  getFiberIdForNative,
  findNativeNodesForFiberId,
  getDisplayNameForFiberId,
}: ReactInterationApi) {
  const overlay = new Overlay();
  let subscriptions: StateSubscriber[] = [];
  let isInspectEnabled = false;
  let hoveredFiberId: number | null = null;

  function subscribe(fn: StateChangeHandler) {
    let handler: StateSubscriber | null = { fn };

    subscriptions.push(handler);

    return function () {
      subscriptions = subscriptions.filter(elem => elem.fn !== fn);
      handler = null;
    };
  }
  function notify() {
    for (const { fn } of subscriptions) {
      fn({
        inspecting: isInspectEnabled,
        hoveredFiberId,
      });
    }
  }

  function onClick(event: MouseEvent) {
    event.preventDefault();
    event.stopPropagation();

    stopInspect();
    selectFiberForNode(event.target as HTMLElement, true);
    notify();
  }

  function onMouseEvent(event: MouseEvent) {
    event.preventDefault();
    event.stopPropagation();
  }

  function onPointerDown(event: MouseEvent) {
    event.preventDefault();
    event.stopPropagation();
  }

  function onPointerOver(event: MouseEvent) {
    event.preventDefault();
    event.stopPropagation();

    if (event.target) {
      const node = event.target as HTMLElement;
      const fiberId = getFiberIdForNative(node as unknown as NativeType, true);
      const ownerName = fiberId
        ? getDisplayNameForFiberId(fiberId) || undefined
        : undefined;

      overlay.inspect([node], undefined, ownerName);
      selectFiberForNode(node);
    }
  }

  function onPointerUp(event: MouseEvent) {
    event.preventDefault();
    event.stopPropagation();
  }

  function selectFiberForNode(node: HTMLElement, selected = false) {
    const fiberId = getFiberIdForNative(node as unknown as NativeType, true);

    if (fiberId !== hoveredFiberId) {
      hoveredFiberId = fiberId;
      if (selected) {
        stopInspect();
      } else {
        notify();
      }
    }
  }

  function startHighlight(fiberId: number) {
    let nodes = findNativeNodesForFiberId(fiberId);

    if (!nodes || !nodes.length) {
      return;
    }

    nodes = nodes.filter(node => node.nodeType === 1);

    if (nodes.length) {
      overlay.inspect(nodes, getDisplayNameForFiberId(fiberId) || "Unknown");
    } else {
      overlay.remove();
    }
  }

  function stopHighlight() {
    overlay.remove();
  }

  function startInspect() {
    if (isInspectEnabled) {
      return;
    }

    window.addEventListener("click", onClick, true);
    window.addEventListener("mousedown", onMouseEvent, true);
    window.addEventListener("mouseover", onMouseEvent, true);
    window.addEventListener("mouseup", onMouseEvent, true);
    window.addEventListener("pointerdown", onPointerDown, true);
    window.addEventListener("pointerover", onPointerOver, true);
    window.addEventListener("pointerup", onPointerUp, true);

    isInspectEnabled = true;
    hoveredFiberId = null;
    notify();
  }

  function stopInspect() {
    window.removeEventListener("click", onClick, true);
    window.removeEventListener("mousedown", onMouseEvent, true);
    window.removeEventListener("mouseover", onMouseEvent, true);
    window.removeEventListener("mouseup", onMouseEvent, true);
    window.removeEventListener("pointerdown", onPointerDown, true);
    window.removeEventListener("pointerover", onPointerOver, true);
    window.removeEventListener("pointerup", onPointerUp, true);

    overlay.remove();
    isInspectEnabled = false;
    notify();
  }

  return {
    subscribe,
    startHighlight,
    stopHighlight,
    startInspect,
    stopInspect,
  };
}
