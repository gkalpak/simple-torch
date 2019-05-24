export interface IEnv {
  readonly version: string;
}

export interface IWindowWithEnv extends Window {
  ENV?: IEnv;
}

export const EMOJI = {
  hourglassNotDone: '⏳',
  noEntrySign: '🚫',
};

export const ENV: IEnv = (window as IWindowWithEnv).ENV || {version: 'N/A'};

export const WIN: IWindowWithEnv = window;
