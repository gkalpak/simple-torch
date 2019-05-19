import {registerComponents as registerLayoutComponents} from './layout/register.js';
import {registerComponents as registerSharedComponents} from './shared/register.js';


export const registerComponents = (): Promise<void> => Promise.
  all([registerLayoutComponents(), registerSharedComponents()]).
  then(() => undefined);
