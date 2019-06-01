import {EMOJI, WIN, ZERO_WIDTH_SPACE} from '../../shared/constants.js';
import {ISettings, Settings} from '../../shared/settings.service.js';
import {ISound, Sounds} from '../../shared/sounds.service.js';
import {Utils} from '../../shared/utils.service.js';
import {BaseCe, IInitializedCe} from '../base.ce.js';


interface ITrackInfo {
  track: MediaStreamTrack | undefined;
  hasTorch: boolean;
}

const enum State {
  Unitialized,
  Initializing,
  Disabled,
  Off,
  On,
}

const EMPTY_TRACK_INFO: ITrackInfo = {track: undefined, hasTorch: false};

export class TorchCe extends BaseCe {
  private static readonly statusMessages = {
    [State.Unitialized]: '-',
    [State.Initializing]: 'INITIALIZING...',
    [State.Disabled]: 'NOT AVAILABLE',
    [State.Off]: 'OFF',
    [State.On]: 'ON',
  };
  private static readonly statusEmojis = {
    [State.Unitialized]: ZERO_WIDTH_SPACE,
    [State.Initializing]: EMOJI.hourglassNotDone,
    [State.Disabled]: EMOJI.noEntrySign,
    [State.Off]: ZERO_WIDTH_SPACE,
    [State.On]: ZERO_WIDTH_SPACE,
  };
  protected static readonly template = `
    <external-svg-ce class="dark no-bg off torch with-effects" src="/assets/images/simple-torch.svg"></external-svg-ce>
    <loader-ce class="loader"></loader-ce>
    <div class="status">
      <div>
        <b>Status:</b>
        <span class="status-message"></span>
      </div>
      <div class="status-message-extra"></div>
    </div>
  `;
  protected static readonly style = `
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
    .torch:not(.unitialized):not(.initializing) ~ .loader {
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

  private readonly settings: ISettings = Settings.getInstance();
  private readonly sounds: Sounds = Sounds.getInstance();
  private readonly utils: Utils = Utils.getInstance();

  private readonly clickSound: ISound = this.sounds.getSound('/assets/audio/click.ogg', 0.15);
  private state: State = State.Unitialized;
  private trackInfoPromise: Promise<ITrackInfo> = Promise.resolve(EMPTY_TRACK_INFO);

  protected async initialize(): Promise<IInitializedCe<this>> {
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

      torchElem.classList.toggle('uninitialized', newState === State.Unitialized);
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
      const [, {track, hasTorch}] = await Promise.all([
        updateState(State.Initializing),
        this.getTrackInfo(true),
      ]);

      if (!hasTorch) {
        const permissionState = (await navigator.permissions.query({name: 'camera'})).state;
        const errorMessage = (permissionState === 'denied') ?
          'Access to camera denied. Please, give permission in browser settings.' : (permissionState === 'prompt') ?
          'Access to camera not granted. Please, give permission when prompted.' :
          `Unable to detect ${!track ? 'camera' : 'torch'} on your device.`;

        throw new Error(errorMessage);
      }

      WIN.document.addEventListener('visibilitychange', () => this.onVisibilityChange());
      await updateState(State.On);
    } catch (err) {
      this.onError(err);
    }

    return self;
  }

  protected async onError(err: Error): Promise<void> {
    super.onError(err);

    const {track} = await this.getTrackInfo();
    if (track) track.stop();

    await this.updateState(State.Disabled, err.message);
  }

  private async getTrackInfo(renewIfNecessary = false): Promise<ITrackInfo> {
    let trackInfo = await this.trackInfoPromise;
    const noActiveTrack = !trackInfo.track || (trackInfo.track.readyState === 'ended');

    if (noActiveTrack) {
      if (renewIfNecessary) {
        this.trackInfoPromise = WIN.navigator.mediaDevices.
          getUserMedia({video: {facingMode: 'environment'}}).
          catch(() => undefined).
          then(stream => stream && stream.getVideoTracks().pop()).
          then(async track => ({
            hasTorch: !!track && await this.utils.waitAndCheck(100, 25, () => !!track.getCapabilities().torch),
            track,
          }));

        trackInfo = await this.trackInfoPromise;
      } else {
        trackInfo = EMPTY_TRACK_INFO;
      }
    }

    return trackInfo;
  }

  private onClick(): void {
    this.updateState((this.state === State.Off) ? State.On : State.Off).catch(err => this.onError(err));
    if (!this.settings.muted) this.clickSound.play();
  }

  private async onVisibilityChange(): Promise<void> {
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

  private async updateState(newState: State, extraMsg?: string): Promise<void> {
    return undefined;
  }
}
