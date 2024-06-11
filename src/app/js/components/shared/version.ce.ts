import {ENV} from '../../shared/constants.js';
import {BaseCe} from '../base.ce.js';


export class VersionCe extends BaseCe {
  protected static override readonly template = `
    <a href="${ENV.repoUrl}/commits/${ENV.sha}" title="SHA: ${ENV.sha.slice(0, 10)}">
      v${ENV.version}
    </a>
  `;
  protected static override readonly style = `
    a {
      color: inherit;
      text-decoration: none;
    }
    a:hover { color: white; }
  `;
}
