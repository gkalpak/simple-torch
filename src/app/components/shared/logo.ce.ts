import {BaseCe, IInitializedCe} from '../base.ce.js';


export class LogoCe extends BaseCe {
  protected static override readonly template =
    '<external-svg-ce src="/assets/images/simple-torch.svg"></external-svg-ce>';
  protected static override readonly style = ':host { cursor: pointer; }';

  protected override async initialize(): Promise<IInitializedCe<this>> {
    const self = await super.initialize();
    const imgElem = self.shadowRoot.querySelector('external-svg-ce')!;

    // Easter egg ;)
    imgElem.addEventListener('click', () => imgElem.classList.toggle('off'));

    return self;
  }
}
