const { hasOwnProperty } = Object.prototype;

export function createElement(
  tag: string,
  attrs: string | {},
  children?: string | any[]
) {
  const el = document.createElement(tag);

  if (typeof attrs === "string") {
    attrs = {
      class: attrs,
    };
  }

  for (let attrName in attrs) {
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
    children.forEach(child =>
      el.appendChild(child instanceof Node ? child : createText(child))
    );
  } else if (typeof children === "string") {
    el.innerHTML = children;
  }

  return el;
}

export function createText(text: any) {
  return document.createTextNode(String(text));
}

export function createFragment(...children: any[]) {
  const fragment = document.createDocumentFragment();

  children.forEach(child =>
    fragment.appendChild(child instanceof Node ? child : createText(child))
  );

  return fragment;
}
