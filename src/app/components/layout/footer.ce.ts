import {BaseCe} from '../base.ce.js';


export class FooterCe extends BaseCe {
  protected static readonly template = `
    <footer>
      <span>
        Copyright &copy; 2019
        <a href="https://github.com/gkalpak">@gkalpak</a>.
        All rights reserved.
      </span>
    </footer>
  `;
  protected static readonly style = `
    :host {
      box-shadow: 0 -6px 10px 0 rgba(0, 0, 0, 0.1),
                  0 -1px 18px 0 rgba(0, 0, 0, 0.08);
    }

    footer {
      align-items: center;
      background-color: rgb(33, 33, 33);
      color: darkgray;
      display: flex;
      font-size: 0.75em;
      justify-content: center;
      letter-spacing: 0.5px;
      padding: 10px 5px;
      word-spacing: 2px;
    }

    footer a { color: inherit; }
    footer a:hover { color: white; }
  `;
}
