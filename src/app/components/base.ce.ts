import {WIN} from '../shared/constants.js';
import {pascalToKebabCase} from '../shared/utils.js';


export type IInitializedCe<T extends BaseCe> = T & {shadowRoot: NonNullable<T['shadowRoot']>};

export abstract class BaseCe extends HTMLElement {
  public static get tagName(): string { return pascalToKebabCase(this.name); }
  protected static readonly template: string = '&lt;base-ce&gt;Not implemented yet.&lt;/base-ce&gt;';
  protected static readonly style: string = '';
  private static readonly baseStyle: string = `
    :host {
      all: initial;
      contain: content;
      display: block;
    }
  `;
  protected readonly clazz: typeof BaseCe = (this.constructor as typeof BaseCe);

  public static register(): Promise<void> {
    const registry = WIN.customElements;
    registry.define(this.tagName, this);
    return registry.whenDefined(this.tagName);
  }

  public connectedCallback(): void {
    this.initialize().catch(err => {
      err.message = `Error initializing custom element '<${this.clazz.tagName}>': ${err.message}`;
      this.onError(err);
    });
  }

  protected async initialize(): Promise<IInitializedCe<this>> {
    if (!this.shadowRoot) {
      const shadowRoot = this.attachShadow({mode: 'open'});

      shadowRoot.innerHTML = `
        <style>
          ${this.clazz.baseStyle}
          ${this.clazz.style}
        </style>
        ${this.clazz.template}
      `;
    }

    return this as IInitializedCe<this>;
  }

  protected onError(err: Error): void {
    console.error(err);
    alert(`ERROR: ${err.message}`);
  }
}
