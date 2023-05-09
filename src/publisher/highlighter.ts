import type Overlay from "./overlay";
import type { ReactDevtoolsHook } from "./react-devtools-hook";
import type { Publisher } from "rempl";
const HIGHLIGHTER_NS = "highlighter";

export default class Highlighter {
  private overlay: Overlay;
  private publisher: Publisher;
  private hook: ReactDevtoolsHook;

  constructor(
    hook: ReactDevtoolsHook,
    publisher: Publisher,
    overlay: Overlay
  ) {
    this.hook = hook;
    this.publisher = publisher;
    this.overlay = overlay;
  }

  startInspect() {
    window.addEventListener('click', this.onClick.bind(this), true);
    window.addEventListener('mousedown', this.onMouseEvent, true);
    window.addEventListener('mouseover', this.onMouseEvent, true);
    window.addEventListener('mouseup', this.onMouseEvent, true);
    window.addEventListener('pointerdown', this.onPointerDown.bind(this), true);
    window.addEventListener('pointerover', this.onPointerOver.bind(this), true);
    window.addEventListener('pointerup', this.onPointerUp, true);
  }

  stopInspect() {
    window.removeEventListener('click', this.onClick, true);
    window.removeEventListener('mousedown', this.onMouseEvent, true);
    window.removeEventListener('mouseover', this.onMouseEvent, true);
    window.removeEventListener('mouseup', this.onMouseEvent, true);
    window.removeEventListener('pointerdown', this.onPointerDown, true);
    window.removeEventListener('pointerover', this.onPointerOver, true);
    window.removeEventListener('pointerup', this.onPointerUp, true);
  }

  private onClick(event: MouseEvent) {
    event.preventDefault();
    event.stopPropagation();

    this.stopInspect();

    this.selectFiberForNode(event.target, true);
    this.publisher.ns(HIGHLIGHTER_NS).publish({ stopInspect: true });
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
    const rendererInterface = this.hook.rendererInterfaces.get(1);

    let fiberID;

    if (rendererInterface) {
      fiberID = rendererInterface.getFiberIDForNative(node, true);
    }

    if (fiberID) {
      this.publisher.ns(HIGHLIGHTER_NS).publish({ fiberID, selected });
    }
  }
}
