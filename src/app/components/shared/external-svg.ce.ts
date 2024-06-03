import {WIN} from '../../shared/constants.js';
import {BaseCe, IInitializedCe} from '../base.ce.js';


export class ExternalSvgCe extends BaseCe {
  public static readonly observedAttributes = ['class'];
  protected static readonly template = '';
  protected static readonly cache = new Map<string, Promise<string>>();
  private svgElem: SVGSVGElement | null = null;

  public attributeChangedCallback(attr: string, _oldValue: string, newValue: string): void {
    switch (attr) {
      case 'class':
        this.updateClass(newValue);
        break;
    }
  }

  protected async initialize(): Promise<IInitializedCe<this>> {
    const self = await super.initialize();
    const src = self.getAttribute('src');

    if (!src) {
      throw new Error('Missing or empty \'src\' attribute.');
    }

    if (!ExternalSvgCe.cache.has(src)) {
      ExternalSvgCe.cache.set(src, WIN.fetch(src).then(res => res.text()));
    }

    const loadingPromise = ExternalSvgCe.cache.get(src)!;

    if (!this.hasAttribute('no-loader')) {
      const timer = setTimeout(() => self.shadowRoot.innerHTML = '<loader-ce></loader-ce>', 500);
      loadingPromise.then(() => clearTimeout(timer));
    }

    self.shadowRoot.innerHTML = await loadingPromise;
    self.svgElem = self.shadowRoot.querySelector('svg');
    self.updateClass(self.className);

    return self;
  }

  private updateClass(newClass: string): void {
    if (this.svgElem) this.svgElem.classList.value = newClass;
  }
}
