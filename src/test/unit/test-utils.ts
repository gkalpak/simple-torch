import {BaseCe, IInitializedCe} from '../../app/components/base.ce.js';
import {WIN} from '../../app/shared/constants.js';


export const getNormalizedTextContent = (elem: IInitializedCe<BaseCe>): string => {
  const html = elem.shadowRoot.innerHTML.replace(/<(style)>[^]*?<\/\1>/g, '');
  const temp = Object.assign(WIN.document.createElement('div'), {innerHTML: html});
  return normalizeWhitespace(temp.textContent || '');
};

export const macrotick = (): Promise<void> => new Promise(resolve => setTimeout(resolve, 0));

export const microtick = (): Promise<void> => new Promise(resolve => resolve());

export const normalizeWhitespace = (input: string): string => input.replace(/\s+/g, ' ').trim();
