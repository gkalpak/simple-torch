import {WIN} from '../../shared/constants.js';
import {waitAndCheck} from '../../shared/utils.js';
import {BaseCe, IInitializedCe} from '../base.ce.js';


const enum State {
  Unitialized,
  Initializing,
  Disabled,
  Off,
  On,
}

const ZERO_WIDTH_SPACE = '\u200b';

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
    [State.Initializing]: '⏳',  // Hourglass not done
    [State.Disabled]: '🚫',  // No entry sign
    [State.Off]: ZERO_WIDTH_SPACE,
    [State.On]: ZERO_WIDTH_SPACE,
  };
  protected static readonly template = `
    <external-svg-ce class="dark no-bg off torch with-effects" src="/assets/images/simple-torch.svg"></external-svg-ce>
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

  protected async initialize(): Promise<IInitializedCe<this>> {
    const self = await super.initialize();
    const torchElem = self.shadowRoot.querySelector('.torch')!;
    const statusMsgElem = self.shadowRoot.querySelector('.status-message')!;
    const statusMsgExtraElem = self.shadowRoot.querySelector('.status-message-extra')!;
    let state: State = State.Unitialized;
    let track: MediaStreamTrack | undefined;

    const onClick = () => updateState((state === State.Off) ? State.On : State.Off);
    const onError = (err: any) => {
      this.onError(err);

      track = undefined;
      updateState(State.Disabled, err.message);
    };
    const updateState = (newState: State, extraMsg?: string) => {
      if ((newState !== State.Off) && (newState !== State.On)) {
        torchElem.removeEventListener('click', onClick);
      } else if ((state !== State.Off) && (state !== State.On)) {
        torchElem.addEventListener('click', onClick);
      }

      const on = newState === State.On;

      torchElem.classList.toggle('initializing', newState === State.Initializing);
      torchElem.classList.toggle('disabled', newState === State.Disabled);
      torchElem.classList.toggle('off', !on);

      statusMsgElem.textContent = `${TorchCe.statusMessages[newState]} ${TorchCe.statusEmojis[newState]}`;
      statusMsgExtraElem.textContent = extraMsg || ZERO_WIDTH_SPACE;

      state = newState;

      if (track) {
        track.applyConstraints({advanced: [{torch: on}]}).catch(onError);
      }
    };

    try {
      updateState(State.Initializing);

      const stream = await WIN.navigator.mediaDevices.
        getUserMedia({video: {facingMode: 'environment'}}).
        catch(() => undefined);
      track = stream && stream.getVideoTracks().pop();
      const hasTorch = !!track && await waitAndCheck(100, 25, () => !!track!.getCapabilities().torch);

      if (!hasTorch) {
        throw new Error('Unable to access camera or torch.');
      }

      updateState(State.On);
    } catch (err) {
      onError(err);
    }

    return self;
  }
}
