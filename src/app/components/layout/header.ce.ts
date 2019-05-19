import {BaseCe} from '../base.ce.js';


export class HeaderCe extends BaseCe {
  protected static readonly template = `
    <header>
      <b>Simple Torch</b>
      <version-ce></version-ce>
    </header>
  `;
  protected static readonly style = `
    header {
      background-color: khaki;
      display: flex;
      justify-content: space-between;
      padding: 5px 10px;
    }
  `;
}
