import {WIN} from '../shared/constants.js';
import {assertNotAbstract, pascalToKebabCase} from '../shared/utils.js';


export class BaseCe extends HTMLElement {
  /** @type {string} */
  static get tagName() { return pascalToKebabCase(this.name); }
  /** @type {string} */
  static get _content() { return '&lt;base-ce&gt;Not implemented yet.&lt;/base-ce&gt;'; }

  constructor() {
    super();
    assertNotAbstract(BaseCe, this);

    this.__initialized = false;
  }

  static register() {
    const registry = WIN.customElements;
    registry.define(this.tagName, this);
    return registry.whenDefined(this.tagName);
  }

  connectedCallback() {
    this._initialize();
  }

  async _initialize() {
    if (!this._initialized) {
      this._initialized = true;
      this.innerHTML = this.constructor._content;
    }
  }
}
