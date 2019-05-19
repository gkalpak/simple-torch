import {WIN} from '../shared/constants.js';
import {BaseCe, IInitializedCe} from './base.ce.js';


export class ExternalSvgCe extends BaseCe {
  public static readonly observedAttributes = ['class'];
  protected static readonly template = 'Loading...';
  private static readonly cache = new Map<string, Promise<string>>();
  private svgElem: SVGSVGElement | null = null;

  public attributeChangedCallback(attr: string, oldValue: string, newValue: string): void {
    switch (attr) {
      case 'class':
        this.updateClass(newValue);
        break;
    }
  }

  protected async initialize(): Promise<IInitializedCe<this>> {
    const self = await super.initialize();
    const src = self.getAttribute('src') || '';

    if (!ExternalSvgCe.cache.has(src)) {
      ExternalSvgCe.cache.set(src, WIN.fetch(src).then(res => res.text()));
    }

    self.shadowRoot.innerHTML = await ExternalSvgCe.cache.get(src)!;
    self.svgElem = self.shadowRoot.querySelector('svg');
    self.updateClass(self.className);

    return self;
  }

  private updateClass(newClass: string): void {
    if (this.svgElem) this.svgElem.classList.value = newClass;
  }
}
