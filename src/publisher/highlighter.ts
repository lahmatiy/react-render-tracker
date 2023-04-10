const HIGHLIGHTER_NS = "highlighter";

export default class Highlighter {
  constructor(hook, publisher, overlay) {
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

    const target = event.target;

    if (target) {
      this.overlay.inspect([target]);

      this.selectFiberForNode(target);
    }
  }

  private onPointerUp(event: MouseEvent) {
    event.preventDefault();
    event.stopPropagation();
  }

  private selectFiberForNode(node) {
    const fiberID = this.hook.rendererInterfaces.get(1).getFiberIDForNative(node, true);

    if (fiberID) {
      this.publisher.ns(HIGHLIGHTER_NS).publish({ fiberID });
    }
  }
}
