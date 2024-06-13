import {BaseCe} from '../base.ce.js';

import {ContentCe} from './content.ce.js';
import {FooterCe} from './footer.ce.js';
import {HeaderCe} from './header.ce.js';
import {TorchCe} from './torch.ce.js';


const components: (typeof BaseCe & CustomElementConstructor)[] = [
  ContentCe,
  FooterCe,
  HeaderCe,
  TorchCe,
];

export const registerComponents = (): Promise<void> => Promise.
  all(components.map(ce => ce.register())).
  then(() => undefined);
