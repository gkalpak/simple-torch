import {BaseCe} from '../base.ce.js';
import {ExternalSvgCe} from './external-svg.ce.js';
import {FlexSpacerCe} from './flex-spacer.ce.js';
import {VersionCe} from './version.ce.js';


const components: Array<typeof BaseCe> = [
  ExternalSvgCe,
  FlexSpacerCe,
  VersionCe,
];

export const registerComponents = (): Promise<void> => Promise.
  all(components.map(ce => ce.register())).
  then(() => undefined);
