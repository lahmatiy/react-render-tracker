import type Overlay from "./overlay";
import type { ReactDevtoolsHook } from "./react-devtools-hook";
import type { Publisher } from "rempl";
const HIGHLIGHTER_NS = "highlighter";

export default class Highlighter {
  private overlay: Overlay;
  private hook: ReactDevtoolsHook;
  private onPublish: () => void;

  private onClickHandler: (event: MouseEvent) => void;
  private onPointerDownHandler: (event: MouseEvent) => void;
  private onPointerOverHandler: (event: MouseEvent) => void;

  private isInspectEnabled: boolean;

  constructor(
    hook: ReactDevtoolsHook,
    overlay: Overlay,
    onPublish: () => void,
  ) {
    this.hook = hook;
    this.overlay = overlay;
    this.onPublish = onPublish;

    this.onClickHandler = this.onClick.bind(this);
    this.onPointerDownHandler = this.onPointerDown.bind(this);
    this.onPointerOverHandler = this.onPointerOver.bind(this);

    this.isInspectEnabled = false;
  }

  startInspect() {
    if (this.isInspectEnabled) {
      return;
    }

    window.addEventListener('click', this.onClickHandler, true);
    window.addEventListener('mousedown', this.onMouseEvent, true);
    window.addEventListener('mouseover', this.onMouseEvent, true);
    window.addEventListener('mouseup', this.onMouseEvent, true);
    window.addEventListener('pointerdown', this.onPointerDownHandler, true);
    window.addEventListener('pointerover', this.onPointerOverHandler, true);
    window.addEventListener('pointerup', this.onPointerUp, true);

    this.isInspectEnabled = true;
  }

  stopInspect() {
    window.removeEventListener('click', this.onClickHandler, true);
    window.removeEventListener('mousedown', this.onMouseEvent, true);
    window.removeEventListener('mouseover', this.onMouseEvent, true);
    window.removeEventListener('mouseup', this.onMouseEvent, true);
    window.removeEventListener('pointerdown', this.onPointerDownHandler, true);
    window.removeEventListener('pointerover', this.onPointerOverHandler, true);
    window.removeEventListener('pointerup', this.onPointerUp, true);

    this.isInspectEnabled = false;
  }

  private onClick(event: MouseEvent) {
    event.preventDefault();
    event.stopPropagation();

    this.stopInspect();

    this.selectFiberForNode(event.target, true);
    this.onPublish({ stopInspect: true });
  }

  private onMouseEvent(event: MouseEvent) {
    event.preventDefault();
    event.stopPropagation();
  }

  private onPointerDown(event: MouseEvent) {
    event.preventDefault();
    event.stopPropagation();
  }

  private onPointerOver(event: MouseEvent) {
    event.preventDefault();
    event.stopPropagation();

    this.overlay.inspect([event.target ?? null]);
    this.selectFiberForNode(event.target);
  }

  private onPointerUp(event: MouseEvent) {
    event.preventDefault();
    event.stopPropagation();
  }

  private selectFiberForNode(node, selected = false) {
    for (const rendererInterface of this.hook.rendererInterfaces.values()) {
      let fiberID;

      if (rendererInterface) {
        fiberID = rendererInterface.getFiberIDForNative(node, true);
      }

      if (fiberID) {
        this.onPublish({ fiberID, selected });
      }

      // Breaking because currently supported only one interface
      break;
    }
  }
}
