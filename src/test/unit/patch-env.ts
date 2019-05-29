import {IWindowWithEnv} from '../../app/shared/constants.js';


(window as IWindowWithEnv).ENV = {
  production: false,
  repoUrl: 'https://pro.vid.er/my/repo',
  sha: 'a1b2c3d4e5f',
  version: '1.33.7-foo',
};
