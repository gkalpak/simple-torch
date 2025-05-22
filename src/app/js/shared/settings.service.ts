import {WIN} from './constants.js';


export interface ISettings {
  muted: boolean;
  torchDeviceId: string;

  unset(key: Exclude<keyof ISettings, 'unset'>): void;
}

export class Settings implements ISettings {
  protected static readonly storageKey: string = 'settings';
  private static instance: Settings | undefined;

  public get muted(): boolean { return this.get('muted', false); }
  public set muted(newValue: boolean) { this.set('muted', newValue); }

  public get torchDeviceId(): string { return this.get('torchDeviceId', ''); }
  public set torchDeviceId(newValue: string) { this.set('torchDeviceId', newValue); }

  private readonly values: Partial<ISettings> = Settings.retrieveValues();

  protected constructor() {
  }

  public static getInstance(): ISettings {
    return this.instance || (this.instance = new Settings());
  }

  public unset<T extends keyof ISettings>(key: T): void {
    delete this.values[key];
    Settings.storeValues(this.values);
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
