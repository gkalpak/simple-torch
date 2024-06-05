import {BaseCe} from '../base.ce.js';


export class ContentCe extends BaseCe {
  protected static override readonly template = '<torch-ce></torch-ce>';
  protected static override readonly style = `
    :host {
      color: darkgray;
      flex-grow: 1;
      padding: 10px;
    }

    torch-ce {
      height: 100%;
      width: 100%;
    }
  `;
}
