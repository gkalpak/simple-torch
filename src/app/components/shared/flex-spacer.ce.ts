import {BaseCe} from '../base.ce.js';


export class FlexSpacerCe extends BaseCe {
  protected static override readonly template = '';
  protected static override readonly style = ':host { flex: 1 1 0; }';
}
