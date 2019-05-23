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
    :host { box-shadow: 0 0 15px -5px; }

    footer {
      align-items: center;
      background-color: rgb(33, 33, 33);
      color: gray;
      display: flex;
      font-size: 0.75em;
      justify-content: center;
      letter-spacing: 0.5px;
      padding: 2px 4px;
      word-spacing: 2px;
    }

    footer a { color: inherit; }
    footer a:hover { color: white; }
  `;
}
