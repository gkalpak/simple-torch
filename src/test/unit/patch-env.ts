import {IWindowWithEnv} from '../../app/shared/constants.js';


(window as IWindowWithEnv).ENV = {
  production: false,
  version: '1.33.7-foo',
};
