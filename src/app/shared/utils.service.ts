import {WIN} from './constants.js';


export class Utils {
  private static instance: Utils | undefined;

  private constructor() {
  }

  public static getInstance(): Utils {
    return this.instance || (this.instance = new Utils());
  }

  public onLoad(cb: () => void | Promise<void>): Promise<void> {
    return new Promise((resolve, reject) => {
      const runCallback = () => Promise.resolve().then(cb).then(resolve, reject);

      if (WIN.document.readyState === 'complete') {
        runCallback();
      } else {
        const listener = () => {
          WIN.removeEventListener('load', listener);
          runCallback();
        };

        WIN.addEventListener('load', listener);
      }
    });
  }

  public pascalToKebabCase(input: string): string {
    return input.
      replace(/^[A-Z]/, m => m.toLowerCase()).
      replace(/[A-Z]/g, m => `-${m.toLowerCase()}`);
  }

  public sleep(duration: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, duration));
  }

  public async waitAndCheck(interval: number, attempts: number, conditionFn: () => boolean): Promise<boolean> {
    while (!conditionFn()) {
      if (--attempts < 0) return false;
      await this.sleep(interval);
    }

    return true;
  }
}
