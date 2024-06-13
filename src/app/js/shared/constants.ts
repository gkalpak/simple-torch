export interface IEnv {
  readonly production: boolean;
  readonly repoUrl: string;
  readonly sha: string;
  readonly version: string;
}

export interface IWindowWithEnv extends Window {
  ENV?: IEnv;
}

export const EMOJI = {
  hourglassNotDone: '⏳',
  noEntrySign: '🚫',
};

export const ENV: IEnv = (window as IWindowWithEnv).ENV || {
  production: false,
  repoUrl: 'N/A',
  sha: 'N/A',
  version: 'N/A',
};

export const WIN: IWindowWithEnv = window;

export const ZERO_WIDTH_SPACE = '\u200b';
