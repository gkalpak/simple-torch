import {ENV} from '../../shared/constants.js';
import {BaseCe} from '../base.ce.js';


export class VersionCe extends BaseCe {
  protected static readonly template = `
    <a href="${ENV.repoUrl}/commit/${ENV.sha.slice(0, 9)}" title="SHA: ${ENV.sha}">
      v${ENV.version}
    </a>
  `;
  protected static readonly style = `
    a {
      color: inherit;
      text-decoration: none;
    }
    a:hover { color: white; }
  `;
}
