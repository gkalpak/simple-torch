import {BaseCe} from '../base.ce.js';
import {TorchCe} from './torch.ce.js';


const components: Array<typeof BaseCe> = [
  TorchCe,
];

export const registerComponents = (): Promise<void> => Promise.
  all(components.map(ce => ce.register())).
  then(() => undefined);
