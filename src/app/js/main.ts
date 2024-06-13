import {registerComponents} from './components/register.js';
import {registerSw} from './shared/register-sw.js';


registerComponents().
  then(() => registerSw('sw.js', /* 12 hours */ 1000 * 60 * 60 * 12));
