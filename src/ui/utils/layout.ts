/* eslint-env browser */
const { documentElement } = document;
const standartsMode = document.compatMode === "CSS1Compat";

export function getOffsetParent(node: HTMLElement) {
  let offsetParent = node.offsetParent as HTMLElement;

  while (
    offsetParent !== null &&
    offsetParent !== documentElement &&
    getComputedStyle(offsetParent).position === "static"
  ) {
    offsetParent = offsetParent.offsetParent as HTMLElement;
  }

  return offsetParent || documentElement;
}

export function getOverflowParent(node: HTMLElement) {
  let overflowParent = node.parentNode as HTMLElement;

  while (
    overflowParent !== null &&
    overflowParent !== documentElement &&
    getComputedStyle(overflowParent).overflow === "visible"
  ) {
    overflowParent = overflowParent.parentNode as HTMLElement;
  }

  return overflowParent || documentElement;
}

export function getPageOffset(element: HTMLElement | null = null) {
  let top = 0;
  let left = 0;

  if (typeof element?.getBoundingClientRect === "function") {
    // offset relative to element
    const rect = element.getBoundingClientRect();

    top = -rect.top;
    left = -rect.left;
  } else {
    // offset relative to page
    if (standartsMode) {
      top = window.pageYOffset || documentElement.scrollTop;
      left = window.pageXOffset || documentElement.scrollLeft;
    } else {
      // quirk mode
      const { body } = document;

      if (element !== body) {
        top = body.scrollTop - body.clientTop;
        left = body.scrollLeft - body.clientLeft;
      }
    }
  }

  return {
    left,
    top,
  };
}

export function getBoundingRect(
  element: HTMLElement | Window,
  relElement?: HTMLElement | null
) {
  const offset = getPageOffset(relElement);
  let top = 0;
  let left = 0;
  let right = 0;
  let bottom = 0;

  if (
    element instanceof HTMLElement &&
    typeof element.getBoundingClientRect === "function"
  ) {
    ({ top, left, right, bottom } = element.getBoundingClientRect());
  }

  top += offset.top;
  left += offset.left;
  right += offset.left;
  bottom += offset.top;

  return {
    top,
    left,
    right,
    bottom,
    width: right - left,
    height: bottom - top,
  };
}

export function getViewportRect(
  element: HTMLElement | Window,
  relElement: HTMLElement | null = null
) {
  const topViewport = standartsMode ? document.documentElement : document.body;
  let { top, left } =
    element === topViewport && !relElement
      ? getPageOffset()
      : getBoundingRect(element, relElement);
  let width: number;
  let height: number;

  if (!element || element instanceof Window) {
    width = window.innerWidth || 0;
    height = window.innerHeight || 0;
  } else {
    top += element.clientTop;
    left += element.clientLeft;
    width = element.clientWidth;
    height = element.clientHeight;
  }

  return {
    top,
    left,
    right: left + width,
    bottom: top + height,
    width,
    height,
  };
}
