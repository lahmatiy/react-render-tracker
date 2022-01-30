const { hasOwnProperty } = Object.prototype;

type EventHandler<Element, Event> = (this: Element, evt: Event) => void;
type Attrs<TagName extends keyof HTMLElementTagNameMap> = {
  [key in keyof HTMLElementEventMap as `on${key}`]?: EventHandler<
    HTMLElementTagNameMap[TagName],
    HTMLElementEventMap[key]
  >;
} & {
  [key: string]: any | undefined; // TODO: replace "any" with "string"
};

export function createElement<TagName extends keyof HTMLElementTagNameMap>(
  tag: TagName,
  attrs: Attrs<TagName> | string | null,
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
        el.addEventListener(attrName.slice(2), value);
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
