import {WIN} from '../shared/constants.js';
import {Utils} from '../shared/utils.service.js';


export type IInitializedCe<T extends BaseCe> = T & {shadowRoot: ShadowRoot};

export abstract class BaseCe extends HTMLElement {
  public static get tagName(): string { return this.utils.pascalToKebabCase(this.name); }
  protected static readonly template: string = '&lt;base-ce&gt;Not implemented yet.&lt;/base-ce&gt;';
  protected static readonly style: string = '';
  private static readonly baseStyle: string = `
    :host {
      all: initial;
      color: inherit;
      contain: content;
      display: block;
      font-family: inherit;
    }
  `;
  private static utils: Utils = Utils.getInstance();

  protected readonly clazz: typeof BaseCe = (this.constructor as typeof BaseCe);
  protected readonly cleanUpFns: Array<() => void> = [];
  private cleanedUp = false;

  public static register(): Promise<void> {
    const registry = WIN.customElements;
    registry.define(this.tagName, this);
    return registry.whenDefined(this.tagName);
  }

  public connectedCallback(): void {
    if (this.cleanedUp) {
      throw new Error(
          `Trying to re-use already disposed custom element '<${this.clazz.tagName}>'. ` +
          `Once '<${this.clazz.tagName}>' elements are removed from the DOM, they cannot be re-inserted.`);
    }

    this.initialize().catch(err => {
      err.message = `Error initializing custom element '<${this.clazz.tagName}>': ${err.message}`;
      this.onError(err);
    });
  }

  public disconnectedCallback(): void {
    this.cleanedUp = true;

    while (this.cleanUpFns.length) {
      try {
        this.cleanUpFns.pop()!();
      } catch (err) {
        err.message = `Error cleaning up custom element '<${this.clazz.tagName}>': ${err.message}`;
        console.error(err);
      }
    }
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
    WIN.alert(`ERROR: ${err.message}`);
  }
}
