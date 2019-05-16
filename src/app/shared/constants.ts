export interface IEnv {
  readonly version: string;
}

export const ENV: IEnv = (window as Window & {ENV?: IEnv}).ENV || {version: 'N/A'};

export const WIN = window;
