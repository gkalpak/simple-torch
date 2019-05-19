import {BaseCe} from '../base.ce.js';


export class FooterCe extends BaseCe {
  protected static readonly template = `
    <footer>
      <small>
        Copyright &copy; 2019
        <a href="https://github.com/gkalpak">@gkalpak</a>.
        All rights reserved.
      </small>
    </footer>
  `;
  protected static readonly style = `
    footer {
      background-color: linen;
      display: flex;
      justify-content: center;
      padding: 2px 4px;
    }
  `;
}
