import {ENV} from '../shared/constants.js';
import {BaseCe} from './base.ce.js';


export class VersionCe extends BaseCe {
  protected static readonly template = `v${ENV.version}`;
}
