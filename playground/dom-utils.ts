const { hasOwnProperty } = Object.prototype;

type Attrs =
  | {
      [key in keyof AddEventListenerOptions]: (evt: Event) => void;
    }
  | {
      [key: string]: string;
    };

export function createElement(
  tag: string,
  attrs: Attrs | string,
  children?: (Node | string)[] | string
) {
  const el = document.createElement(tag);

  if (typeof attrs === "string") {
    attrs = {
      class: attrs,
    };
  }

  for (const attrName in attrs) {
    if (hasOwnProperty.call(attrs, attrName)) {
      if (attrs[attrName] === undefined) {
        continue;
      }

      if (attrName.startsWith("on")) {
        el.addEventListener(attrName.substr(2), attrs[attrName]);
      } else {
        el.setAttribute(attrName, attrs[attrName]);
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
