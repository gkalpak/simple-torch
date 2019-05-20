import {BaseCe} from '../base.ce.js';
import {ExternalSvgCe} from './external-svg.ce.js';
import {FlexSpacerCe} from './flex-spacer.ce.js';
import {LoaderCe} from './loader.ce.js';
import {LogoCe} from './logo.ce.js';
import {VersionCe} from './version.ce.js';


const components: Array<typeof BaseCe> = [
  ExternalSvgCe,
  FlexSpacerCe,
  LoaderCe,
  LogoCe,
  VersionCe,
];

export const registerComponents = (): Promise<void> => Promise.
  all(components.map(ce => ce.register())).
  then(() => undefined);
