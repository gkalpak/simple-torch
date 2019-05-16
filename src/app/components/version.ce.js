import {ENV} from '../shared/constants.js';
import {BaseCe} from './base.ce.js';


export class VersionCe extends BaseCe {
  static get _content() { return `v${ENV.version}`; }
}
