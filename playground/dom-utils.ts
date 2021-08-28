const { hasOwnProperty } = Object.prototype;

type EventHandler<T> = (evt: T) => void;
type Attrs = {
  [key in keyof HTMLElementEventMap as `on${key}`]?:
    | EventHandler<HTMLElementEventMap[key]>
    | undefined;
} & {
  [key: string]: string | undefined;
};

export function createElement(
  tag: string,
  attrs: Attrs | string | null,
  children?: (Node | string)[] | string
) {
  const el = document.createElement(tag);

  if (typeof attrs === "string") {
    attrs = {
      class: attrs,
    };
  }

  for (const attrName in attrs) {
    if (typeof attrName === "string" && hasOwnProperty.call(attrs, attrName)) {
      const value = attrs[attrName];

      if (typeof value === "undefined") {
        continue;
      }

      if (typeof value === "function") {
        el.addEventListener(attrName.substr(2), value);
      } else {
        el.setAttribute(attrName, value);
      }
    }
  }

  if (Array.isArray(children)) {
    el.append(...children);
  } else if (typeof children === "string") {
    el.innerHTML = children;
  }

  return el;
}

export function createText(text: any) {
  return document.createTextNode(String(text));
}

export function createFragment(...children: (Node | string)[]) {
  const fragment = document.createDocumentFragment();

  fragment.append(...children);

  return fragment;
}
