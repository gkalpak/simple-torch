export const macrotick = (): Promise<void> => new Promise(resolve => setTimeout(resolve, 0));

export const microtick = (): Promise<void> => new Promise(resolve => resolve());

export const normalizeWhitespace = (input: string): string => input.replace(/\s+/g, ' ').trim();
