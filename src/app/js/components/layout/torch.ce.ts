import {EMOJI, WIN, ZERO_WIDTH_SPACE} from '../../shared/constants.js';
import {ISettings, Settings} from '../../shared/settings.service.js';
import {ISound, Sounds} from '../../shared/sounds.service.js';
import {BaseCe, IInitializedCe} from '../base.ce.js';


interface ITrackInfo {
  hasCamera: boolean;
  hasTorch: boolean;
  track: MediaStreamTrack | undefined;
}

export const enum State {
  Uninitialized,
  Initializing,
  Disabled,
  Off,
  On,
}

export const EMPTY_TRACK_INFO: ITrackInfo = {hasCamera: false, hasTorch: false, track: undefined};

export class TorchCe extends BaseCe {
  private static readonly statusMessages = {
    [State.Uninitialized]: '-',
    [State.Initializing]: 'INITIALIZING...',
    [State.Disabled]: 'NOT AVAILABLE',
    [State.Off]: 'OFF',
    [State.On]: 'ON',
  };
  private static readonly statusEmojis = {
    [State.Uninitialized]: ZERO_WIDTH_SPACE,
    [State.Initializing]: EMOJI.hourglassNotDone,
    [State.Disabled]: EMOJI.noEntrySign,
    [State.Off]: ZERO_WIDTH_SPACE,
    [State.On]: ZERO_WIDTH_SPACE,
  };
  protected static override readonly template = `
    <external-svg-ce
        class="dark no-bg off torch uninitialized with-effects"
        src="assets/images/simple-torch.svg">
    </external-svg-ce>
    <loader-ce class="loader"></loader-ce>
    <div class="status">
      <div>
        <b>Status:</b>
        <span class="status-message"></span>
      </div>
      <div class="status-message-extra"></div>
    </div>
  `;
  protected static override readonly style = `
    :host {
      display: flex;
      flex-direction: column;

      --simple-torch-rotation: 0;
      --simple-torch-stroke-color: rgb(55, 44, 55);
    }

    .loader {
      color: orange;
      height: 10%;
      left: 0;
      position: absolute;
      right: 0;
      top: 20px;
    }
    .torch:not(.uninitialized):not(.initializing) ~ .loader {
      display: none;
    }

    .status {
      padding-bottom: 20px;
      text-align: center;
    }

    .status-message-extra {
      color: orange;
      font-size: small;
      margin-top: 5px;
    }

    .torch {
      cursor: pointer;
      flex-grow: 1;
      max-height: 75vh;
      -webkit-tap-highlight-color: transparent;
    }
    .torch.disabled {
      cursor: not-allowed;
      opacity: 0.5;
    }
    .torch.initializing { cursor: progress; }
  `;

  protected state: State = State.Uninitialized;
  protected trackInfoPromise: Promise<ITrackInfo> = Promise.resolve(EMPTY_TRACK_INFO);

  private readonly settings: ISettings = Settings.getInstance();
  private readonly sounds: Sounds = Sounds.getInstance();

  private readonly clickSound: ISound = this.sounds.getSound('assets/audio/click.ogg', 0.15);

  protected async acquireCameraPermission(): Promise<void> {
    let permissionState: PermissionState | 'unknown' = 'unknown';

    try {
      // Chrome supports `name: camera`, while Firefox (and potentially other browsers) do not.
      // See also: https://developer.mozilla.org/en-US/docs/Web/API/Permissions/query
      permissionState = (await WIN.navigator.permissions.query({name: 'camera' as PermissionName})).state;
    } catch {
      // eslint-ignore-line no-empty
    }

    if ((permissionState === 'prompt') || (permissionState === 'unknown')) {
      try {
        await WIN.navigator.mediaDevices.getUserMedia({video: true});
        permissionState = 'granted';
      } catch {
        permissionState = 'denied';
      }
    }

    if (permissionState === 'denied') {
      throw new Error(
          'Unable to access camera. If supported on your device, please give permission in browser settings.');
    }
  }

  protected async getTrackInfo(renewIfNecessary = false): Promise<ITrackInfo> {
    let trackInfo = await this.trackInfoPromise;
    const noActiveTrack = !trackInfo.track || (trackInfo.track.readyState === 'ended');

    if (noActiveTrack) {
      if (renewIfNecessary) {
        this.trackInfoPromise = (async () => {
          await this.acquireCameraPermission();

          let hasCamera = false;
          for await (const deviceId of this.getCameraDeviceIds()) {
            hasCamera = true;

            const stream = await WIN.navigator.mediaDevices.getUserMedia({
              video: {
                deviceId: {exact: deviceId},
              },
            });
            const track = stream.getVideoTracks().pop();

            if (track?.getCapabilities?.().torch === true) {
              this.settings.torchDeviceId = deviceId;
              return {hasCamera: true, hasTorch: true, track};
            } else {
              track?.stop();
            }
          }

          return {
            ...EMPTY_TRACK_INFO,
            hasCamera,
          };
        })();

        trackInfo = await this.trackInfoPromise;
      } else {
        trackInfo = EMPTY_TRACK_INFO;
      }
    }

    return trackInfo;
  }

  protected override async initialize(): Promise<IInitializedCe<this>> {
    const self = await super.initialize();
    const torchElem = self.shadowRoot.querySelector('.torch')!;
    const statusMsgElem = self.shadowRoot.querySelector('.status-message')!;
    const statusMsgExtraElem = self.shadowRoot.querySelector('.status-message-extra')!;

    const onClick = () => this.onClick();
    const updateState = this.updateState = async (newState: State, extraMsg?: string) => {
      if ((newState !== State.Off) && (newState !== State.On)) {
        torchElem.removeEventListener('click', onClick);
      } else if ((this.state !== State.Off) && (this.state !== State.On)) {
        torchElem.addEventListener('click', onClick);
      }

      const on = newState === State.On;

      torchElem.classList.toggle('uninitialized', newState === State.Uninitialized);
      torchElem.classList.toggle('initializing', newState === State.Initializing);
      torchElem.classList.toggle('disabled', newState === State.Disabled);
      torchElem.classList.toggle('off', !on);

      statusMsgElem.textContent = `${TorchCe.statusMessages[newState]} ${TorchCe.statusEmojis[newState]}`;
      statusMsgExtraElem.textContent = extraMsg || ZERO_WIDTH_SPACE;

      this.state = newState;

      const {track} = await this.getTrackInfo();
      if (track) track.applyConstraints({advanced: [{torch: on}]});
    };

    try {
      // NOTE:
      // Using `Promise.all()` here causes an "Unhandled promise rejection" error when both promises
      // fail (e.g. during tests). This sounds like a bug (but not sure where) ¯\_(ツ)_/¯
      // The `updateState()` call should complete fairly quickly, though, so serial execution should
      // not have a noticeable impact here.
      await updateState(State.Initializing);
      const {hasCamera, hasTorch} = await this.getTrackInfo(true);

      if (!hasTorch) {
        throw new Error(`Unable to detect ${hasCamera ? 'torch' : 'camera'} on your device.`);
      }

      const onVisibilityChange = () => this.onVisibilityChange();
      WIN.document.addEventListener('visibilitychange', onVisibilityChange);

      this.cleanUpFns.push(
          () => WIN.document.removeEventListener('visibilitychange', onVisibilityChange),
          () => this.stopTrack());

      await updateState(State.On);
    } catch (err) {
      this.onError(err);
    }

    return self;
  }

  protected async onClick(): Promise<void> {
    if (!this.settings.muted) this.clickSound.play();
    await this.updateState((this.state === State.Off) ? State.On : State.Off).catch(err => this.onError(err));
  }

  protected override async onError(err: unknown): Promise<Error> {
    const err2 = await super.onError(err);

    await this.stopTrack();
    await this.updateState(State.Disabled, err2.message);

    return err2;
  }

  protected async onVisibilityChange(): Promise<void> {
    const {track} = await this.getTrackInfo(!WIN.document.hidden);
    if (!track) return;

    if (WIN.document.hidden) {
      if (this.state === State.Off) {
        track.stop();
      }
    } else if (this.state === State.On) {
      track.applyConstraints({advanced: [{torch: true}]});
    }
  }

  protected async updateState(_newState: State, _extraMsg?: string): Promise<void> {
    return undefined;
  }

  private async stopTrack(): Promise<void> {
    const {track} = await this.getTrackInfo();
    if (track) track.stop();
  }

  private async *getCameraDeviceIds(): AsyncGenerator<string> {
    if (this.settings.torchDeviceId !== '') {
      yield this.settings.torchDeviceId;
    }

    const devices = await WIN.navigator.mediaDevices.enumerateDevices();
    const cameras = devices.
      filter((x): x is MediaDeviceInfo & {kind: 'videoinput'} => x.kind === 'videoinput').
      reverse();  // Often, it is the last camera that has the torch.

    for (const cam of cameras) {
      yield cam.deviceId;
    }
  }
}
