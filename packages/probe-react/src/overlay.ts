const OUTLINE_MS = 300;

const STYLES = `
  .mark {
    position: fixed;
    box-sizing: border-box;
    border: 2px solid transparent;
    pointer-events: none;
    z-index: 2147483647;
    transition: border-color 150ms;
  }
  .mark.flash { border-color: #e11d48; }
  .badge {
    position: absolute;
    top: -10px;
    right: -10px;
    padding: 2px 5px;
    border-radius: 8px;
    background: #e11d48;
    color: white;
    font: 11px/1 monospace;
  }
`;

type Mark = {
    element: Element;
    box: HTMLDivElement;
    badge: HTMLSpanElement;
    timer?: number;
};

export class Overlay {
    private layer: ShadowRoot | undefined;
    private readonly marks = new Map<string, Mark>();

    flash(instanceId: string, element: Element, count: number): void {
        let mark = this.marks.get(instanceId);
        if (!mark) {
            mark = this.createMark(instanceId, element);
            this.marks.set(instanceId, mark);
        }

        mark.element = element;
        mark.badge.textContent = String(count);
        this.position(mark);

        const box = mark.box;
        box.classList.add('flash');
        window.clearTimeout(mark.timer);
        mark.timer = window.setTimeout(() => box.classList.remove('flash'), OUTLINE_MS);
    }

    remove(instanceId: string): void {
        this.marks.get(instanceId)?.box.remove();
        this.marks.delete(instanceId);
    }

    clear(): void {
        for (const mark of this.marks.values()) mark.box.remove();
        this.marks.clear();
    }

    private createMark(instanceId: string, element: Element): Mark {
        const box = document.createElement('div');
        box.className = 'mark';
        box.dataset.instanceId = instanceId;

        const badge = document.createElement('span');
        badge.className = 'badge';
        box.append(badge);

        this.getLayer().append(box);
        return { element, box, badge };
    }

    private getLayer(): ShadowRoot {
        if (!this.layer) {
            const host = document.createElement('render-lab-probe');
            this.layer = host.attachShadow({ mode: 'open' });
            const style = document.createElement('style');
            style.textContent = STYLES;
            this.layer.append(style);
            document.body.append(host);

            window.addEventListener('scroll', () => this.repositionAll(), true);
            window.addEventListener('resize', () => this.repositionAll());
        }
        return this.layer;
    }

    private repositionAll(): void {
        for (const [instanceId, mark] of this.marks) {
            if (mark.element.isConnected) this.position(mark);
            else this.remove(instanceId);
        }
    }

    private position(mark: Mark): void {
        const rect = mark.element.getBoundingClientRect();
        mark.box.style.top = `${rect.top}px`;
        mark.box.style.left = `${rect.left}px`;
        mark.box.style.width = `${rect.width}px`;
        mark.box.style.height = `${rect.height}px`;
    }
}