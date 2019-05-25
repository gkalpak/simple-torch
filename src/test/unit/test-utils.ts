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

// tslint:disable-next-line: variable-name
export const setupCeContainer = (): <T extends BaseCe>(CeClass: new() => T) => Promise<IInitializedCe<T>> => {
  const container = document.createElement('div');

  beforeAll(() => WIN.document.body.appendChild(container));
  beforeEach(() => container.innerHTML = '');
  afterAll(() => container.remove());

  // tslint:disable-next-line: variable-name
  return async <T extends BaseCe>(CeClass: new() => T) => {
    const elem = new CeClass();
    container.appendChild(elem);

    await macrotick();  // Wait for initialization to complete.

    return elem as IInitializedCe<T>;
  };
};
