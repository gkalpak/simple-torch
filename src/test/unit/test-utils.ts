import {BaseCe, IInitializedCe} from '../../app/components/base.ce.js';
import {WIN, ZERO_WIDTH_SPACE} from '../../app/shared/constants.js';


export interface IMockPropertyHelpers<T, P extends keyof T> {
  setMockValue(mockValue: T[P]): void;
  restoreOriginalValue(): void;
}

export interface IPropertySpyHelpers<T, P extends keyof T> {
  getSpy: jasmine.Spy;
  setSpy: jasmine.Spy;

  installSpies(): void;
  uninstallSpies(): void;
  setMockValue(value: T[P]): void;
}

export const getNormalizedTextContent = (elem: IInitializedCe<BaseCe>): string => {
  const html = elem.shadowRoot.innerHTML.replace(/<(style)>[^]*?<\/\1>/g, '');
  const temp = Object.assign(WIN.document.createElement('div'), {innerHTML: html});
  return normalizeWhitespace(temp.textContent);
};

export const macrotick = (): Promise<void> => new Promise(resolve => setTimeout(resolve, 0));

export const macrotickWithMockedClock = async () => {
  const macrotickPromise = macrotick();
  jasmine.clock().tick(0);
  await macrotickPromise;
};

export const microtick = (): Promise<void> => new Promise(resolve => resolve());

export const mockProperty = <T, P extends keyof T>(ctx: T, prop: P): IMockPropertyHelpers<T, P> => {
  const {setMockValue, installSpies, uninstallSpies} = spyProperty(ctx, prop);

  beforeEach(installSpies);
  afterEach(uninstallSpies);

  return {setMockValue, restoreOriginalValue: uninstallSpies};
};

export const normalizeWhitespace = (input: string | null): string => (input || '').
  replace(new RegExp(`[\\s${ZERO_WIDTH_SPACE}]+`, 'g'), ' ').
  trim();

export const reversePromise = (promise: Promise<unknown>): Promise<unknown> =>
  promise.then(() => Promise.reject('Promise did not reject.'), err => err);

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

export const spyProperty = <T, P extends keyof T>(ctx: T, prop: P): IPropertySpyHelpers<T, P> => {
  const originalDescriptor = Object.getOwnPropertyDescriptor(ctx, prop);

  let value = ctx[prop];
  const setMockValue = (mockValue: typeof value) => value = mockValue;
  const setSpy = jasmine.createSpy(`set ${prop}`).and.callFake(setMockValue);
  const getSpy = jasmine.createSpy(`get ${prop}`).and.callFake(() => value);

  const installSpies = () => {
    value = ctx[prop];
    Object.defineProperty(ctx, prop, {
      configurable: true,
      enumerable: originalDescriptor ? originalDescriptor.enumerable : true,
      get: getSpy,
      set: setSpy,
    });
  };
  const uninstallSpies = () => originalDescriptor ?
    Object.defineProperty(ctx, prop, originalDescriptor) :
    delete ctx[prop];

  return {installSpies, uninstallSpies, setMockValue, getSpy, setSpy};
};
