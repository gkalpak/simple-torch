import {BaseCe} from '../base.ce.js';


export class HeaderCe extends BaseCe {
  protected static readonly template = `
    <header>
      <b>Simple Torch</b>
      <flex-spacer-ce></flex-spacer-ce>
      <version-ce></version-ce>
    </header>
  `;
  protected static readonly style = `
    :host { box-shadow: 0 0 10px; }

    header {
      align-items: center;
      background-color: rgb(33, 33, 33);
      color: lightgray;
      display: flex;
      padding: 5px 10px;
    }
  `;
}
