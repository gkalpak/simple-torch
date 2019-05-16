import {WIN} from '../shared/constants.js';
import {pascalToKebabCase} from '../shared/utils.js';


export abstract class BaseCe extends HTMLElement {
  public static get tagName(): string { return pascalToKebabCase(this.name); }
  protected static readonly content: string = '&lt;base-ce&gt;Not implemented yet.&lt;/base-ce&gt;';
  private initialized: boolean = false;

  public static register(): Promise<void> {
    const registry = WIN.customElements;
    registry.define(this.tagName, this);
    return registry.whenDefined(this.tagName);
  }

  public connectedCallback(): void {
    this.initialize();
  }

  protected async initialize() {
    if (!this.initialized) {
      this.initialized = true;
      this.innerHTML = (this.constructor as typeof BaseCe).content;
    }
  }
}
