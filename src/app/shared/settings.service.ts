import {WIN} from './constants.js';


export interface ISettings {
  muted: boolean;
}

export class Settings implements ISettings {
  protected static readonly storageKey: string = 'settings';
  private static instance: Settings | undefined;

  public get muted(): boolean { return this.get('muted', false); }
  public set muted(newValue: boolean) { this.set('muted', newValue); }

  private readonly values: Partial<ISettings> = Settings.retrieveValues();

  protected constructor() {
  }

  public static getInstance(): ISettings {
    return this.instance || (this.instance = new Settings());
  }

  protected static retrieveValues(): Partial<ISettings> {
    return JSON.parse(WIN.localStorage[Settings.storageKey] || '{}');
  }

  protected static storeValues(values: Partial<ISettings>): void {
    WIN.localStorage[Settings.storageKey] = JSON.stringify(values);
  }

  private get<T extends keyof ISettings>(key: T, fallbackValue: ISettings[T]): ISettings[T] {
    return Object.hasOwn(this.values, key) ? this.values[key] as ISettings[T] : fallbackValue;
  }

  private set<T extends keyof ISettings>(key: T, value: ISettings[T]): void {
    this.values[key] = value;
    Settings.storeValues(this.values);
  }
}
