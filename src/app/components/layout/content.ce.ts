import {BaseCe} from '../base.ce.js';


export class ContentCe extends BaseCe {
  protected static readonly template = '<torch-ce></torch-ce>';
  protected static readonly style = `
    :host {
      align-items: center;
      background-color: floralwhite;
      display: flex;
      flex-grow: 1;
      justify-content: center;
      padding: 5px 10px;
    }
  `;
}
