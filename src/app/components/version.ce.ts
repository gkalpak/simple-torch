import {ENV} from '../shared/constants.js';
import {BaseCe} from './base.ce.js';


export class VersionCe extends BaseCe {
  public static readonly content = `v${ENV.version}`;
}
