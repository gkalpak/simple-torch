import {BaseCe} from '../base.ce.js';


export class HeaderCe extends BaseCe {
  protected static readonly template = `
    <header>
      <logo-ce></logo-ce>
      <b>Simple Torch</b>
      <flex-spacer-ce></flex-spacer-ce>
      <version-ce></version-ce>
    </header>
  `;
  protected static readonly style = `
    :host {
      box-shadow: 0 6px 10px 0 rgba(0, 0, 0, 0.14),
                  0 1px 18px 0 rgba(0, 0, 0, 0.12);
    }

    header {
      align-items: center;
      background-color: rgb(33, 33, 33);
      color: darkgray;
      display: flex;
      padding: 15px 10px;
    }

    header logo-ce {
      height: 25px;
      margin-right: 10px;
      width: 25px;

      --simple-torch-outline-color: transparent;
    }
  `;
}
