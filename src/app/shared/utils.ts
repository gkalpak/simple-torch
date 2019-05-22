export const pascalToKebabCase =
  (input: string): string => input.
    replace(/^[A-Z]/, m => m.toLowerCase()).
    replace(/[A-Z]/g, m => `-${m.toLowerCase()}`);

export const sleep =
  (duration: number): Promise<void> => new Promise(resolve => setTimeout(resolve, duration));

export const waitAndCheck =
  async (interval: number, attempts: number, conditionFn: () => boolean): Promise<boolean> => {
    while (!conditionFn()) {
      if (--attempts < 0) return false;
      await sleep(interval);
    }

    return true;
  };
