import {TorchCe} from './torch.ce.js';
import {VersionCe} from './version.ce.js';


/** @type {(typeof import('./base.ce').BaseCe)[]} */
const components = [
  TorchCe,
  VersionCe,
];

export const registerComponents = () => Promise.
  all(components.map(ce => ce.register())).
  then(() => {});
