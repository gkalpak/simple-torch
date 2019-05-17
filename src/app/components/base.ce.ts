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

  public static register(): Promise<void> {
    const registry = WIN.customElements;
    registry.define(this.tagName, this);
    return registry.whenDefined(this.tagName);
  }

  public connectedCallback(): void {
    this.initialize();
  }

  protected async initialize(): Promise<IInitializedCe<this>> {
    if (!this.shadowRoot) {
      const clazz = (this.constructor as typeof BaseCe);
      const shadowRoot = this.attachShadow({mode: 'open'});

      shadowRoot.innerHTML = `
        <style>
          ${clazz.baseStyle}
          ${clazz.style}
        </style>
        ${clazz.template}
      `;
    }

    return this as IInitializedCe<this>;
  }
}