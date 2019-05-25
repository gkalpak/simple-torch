import {BaseCe, IInitializedCe} from '../../app/components/base.ce.js';
import {WIN} from '../../app/shared/constants.js';


export const getNormalizedTextContent = (elem: IInitializedCe<BaseCe>): string => {
  const html = elem.shadowRoot.innerHTML.replace(/<(style)>[^]*?<\/\1>/g, '');
  const temp = Object.assign(WIN.document.createElement('div'), {innerHTML: html});
  return normalizeWhitespace(temp.textContent || '');
};

export const macrotick = (): Promise<void> => new Promise(resolve => setTimeout(resolve, 0));

export const macrotickWithMockedClock = async () => {
  const macrotickPromise = macrotick();
  jasmine.clock().tick(0);
  await macrotickPromise;
};

export const microtick = (): Promise<void> => new Promise(resolve => resolve());

export const normalizeWhitespace = (input: string): string => input.replace(/\s+/g, ' ').trim();

export const setupCeContainer = () => {
  const container = document.createElement('div');

  beforeAll(() => WIN.document.body.appendChild(container));
  beforeEach(() => container.innerHTML = '');
  afterAll(() => container.remove());

  return async <T extends BaseCe>(ceClassOrInstance: (new() => T) | T, attrs: {[name: string]: string} = {}) => {
    const elem = (ceClassOrInstance instanceof BaseCe) ? ceClassOrInstance : new ceClassOrInstance();
    Object.keys(attrs).forEach(name => elem.setAttribute(name, attrs[name]));

    container.appendChild(elem);
    await macrotick();  // Wait for initialization to complete.

    return elem as IInitializedCe<T>;
  };
};
