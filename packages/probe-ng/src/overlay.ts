// Capa superpuesta de la sonda: contorno de ~300 ms y badge con el contador por
// instancia. No toca el DOM de los componentes medidos: todo se dibuja en un
// elemento propio, hijo de <body>, con shadow DOM y `position: fixed`,
// posicionado con getBoundingClientRect del host.

const FLASH_MS = 300;

const STYLES = `
  :host { all: initial; }
  .mark { position: fixed; pointer-events: none; box-sizing: border-box; }
  .outline {
    position: absolute; inset: 0; box-sizing: border-box;
    border: 2px solid #dd0031; border-radius: 2px;
    opacity: 0; transition: opacity 150ms ease-out;
  }
  .mark.flash .outline { opacity: 1; transition: none; }
  .badge {
    position: absolute; top: 0; right: 0;
    padding: 0 4px; border-radius: 0 0 0 4px;
    background: #dd0031; color: #fff;
    font: bold 11px/16px ui-monospace, monospace;
  }
`;

interface Mark {
  readonly host: Element;
  readonly el: HTMLElement;
  readonly badge: HTMLElement;
  timer: ReturnType<typeof setTimeout> | undefined;
}

export class Overlay {
  private readonly marks = new Map<object, Mark>();
  private layer: ShadowRoot | undefined;
  private frame: number | undefined;
  private readonly doc: Document;
  private readonly onGone: (key: object) => void;

  /** `onGone` avisa cuando el host de una instancia sale del documento. */
  constructor(doc: Document, onGone: (key: object) => void) {
    this.doc = doc;
    this.onGone = onGone;
  }

  /** Hace parpadear la instancia y actualiza su badge. */
  flash(key: object, host: Element, label: string, count: number): void {
    let mark = this.marks.get(key);
    if (!mark) {
      const el = this.doc.createElement('div');
      el.className = 'mark';
      const outline = this.doc.createElement('div');
      outline.className = 'outline';
      const badge = this.doc.createElement('div');
      badge.className = 'badge';
      el.append(outline, badge);
      this.getLayer().append(el);
      mark = { host, el, badge, timer: undefined };
      this.marks.set(key, mark);
    }
    mark.badge.textContent = String(count);
    mark.el.title = `${label}: ${count}`;
    mark.el.classList.add('flash');
    clearTimeout(mark.timer);
    const current = mark;
    mark.timer = setTimeout(() => current.el.classList.remove('flash'), FLASH_MS);
    this.position(mark);
    this.schedule();
  }

  /** Quita la marca de una instancia. */
  remove(key: object): void {
    const mark = this.marks.get(key);
    if (!mark) return;
    clearTimeout(mark.timer);
    mark.el.remove();
    this.marks.delete(key);
  }

  /** Quita todas las marcas. */
  clear(): void {
    for (const key of [...this.marks.keys()]) this.remove(key);
  }

  private getLayer(): ShadowRoot {
    if (!this.layer) {
      const hostEl = this.doc.createElement('render-lab-probe');
      hostEl.setAttribute('aria-hidden', 'true');
      this.layer = hostEl.attachShadow({ mode: 'open' });
      const style = this.doc.createElement('style');
      style.textContent = STYLES;
      this.layer.append(style);
      this.doc.body.append(hostEl);
    }
    return this.layer;
  }

  /**
   * Mientras haya marcas, sigue a sus hosts en cada frame (scroll, cambios de
   * layout) y retira las de hosts que ya no están en el documento.
   */
  private schedule(): void {
    if (this.frame !== undefined) return;
    const view = this.doc.defaultView;
    if (!view) return;
    this.frame = view.requestAnimationFrame(() => {
      this.frame = undefined;
      for (const [key, mark] of this.marks) {
        if (mark.host.isConnected) {
          this.position(mark);
        } else {
          this.remove(key);
          this.onGone(key);
        }
      }
      if (this.marks.size > 0) this.schedule();
    });
  }

  private position(mark: Mark): void {
    const rect = measure(this.doc, mark.host);
    const style = mark.el.style;
    style.display = rect ? '' : 'none';
    if (!rect) return;
    style.left = `${rect.left}px`;
    style.top = `${rect.top}px`;
    style.width = `${rect.width}px`;
    style.height = `${rect.height}px`;
  }
}

/**
 * Caja del host. Los hosts de Angular son `display: inline` por defecto y su
 * rect no siempre cubre a sus hijos de bloque, así que se une con el rect de
 * su contenido.
 */
function measure(doc: Document, host: Element): DOMRect | null {
  const own = host.getBoundingClientRect();
  const range = doc.createRange();
  range.selectNodeContents(host);
  const content = range.getBoundingClientRect();
  const boxes = [own, content].filter((r) => r.width > 0 || r.height > 0);
  if (boxes.length === 0) return null;
  const left = Math.min(...boxes.map((r) => r.left));
  const top = Math.min(...boxes.map((r) => r.top));
  const right = Math.max(...boxes.map((r) => r.right));
  const bottom = Math.max(...boxes.map((r) => r.bottom));
  return new DOMRect(left, top, right - left, bottom - top);
}
