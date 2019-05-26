import {WIN} from './constants.js';


export interface ISound {
  src: string;
  volume: number;

  play(): Promise<void>;
}

export class Sounds {
  private static instance: Sounds | undefined;
  private readonly cache: {[src: string]: ISound} = {};

  private constructor() {
  }

  public static getInstance(): Sounds {
    return this.instance || (this.instance = new Sounds());
  }

  public getSound(src: string, volume = 1): ISound {
    const key = `${src}:${volume}`;
    return this.cache[key] || (this.cache[key] = Object.assign(WIN.document.createElement('audio'), {src, volume}));
  }
}
