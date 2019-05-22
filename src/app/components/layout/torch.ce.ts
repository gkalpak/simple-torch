import {WIN} from '../../shared/constants.js';
import {waitAndCheck} from '../../shared/utils.js';
import {BaseCe, IInitializedCe} from '../base.ce.js';


const enum State {
  Loading = 'loading...',
  Disabled = 'not available' ,
  Off = 'off',
  On = 'on',
}

export class TorchCe extends BaseCe {
  protected static readonly template = `
    <external-svg-ce class="dark no-bg off torch" src="/assets/images/simple-torch.svg"></external-svg-ce>
    <div class="status">
      <b>Status:</b>
      <span class="status-message"></span>
    </div>
  `;
  protected static readonly style = `
    :host{
      --simple-torch-rotation: 0;
      --simple-torch-stroke-color: rgb(55, 44, 55);
    }

    .status { text-align: center; }

    .status-message { text-transform: uppercase; }

    .torch {
      cursor: pointer;
      -webkit-tap-highlight-color: transparent;
    }
    .torch.loading { cursor: progress; }
    .torch.disabled { cursor: not-allowed; }
  `;

  protected async initialize(): Promise<IInitializedCe<this>> {
    const self = await super.initialize();
    const torchElem = self.shadowRoot.querySelector('.torch')!;
    const statusMsgElem = self.shadowRoot.querySelector('.status-message')!;
    let state: State = State.Loading;
    let track: MediaStreamTrack | undefined;

    const onClick = () => updateState((state === State.Off) ? State.On : State.Off);
    const onError = (err: any) => {
      this.onError(err);

      track = undefined;
      updateState(State.Disabled);
    };
    const updateState = (newState: State) => {
      if ((newState !== State.Off) && (newState !== State.On)) {
        torchElem.removeEventListener('click', onClick);
      } else if ((state !== State.Off) && (state !== State.On)) {
        torchElem.addEventListener('click', onClick);
      }

      const on = newState === State.On;

      torchElem.classList.toggle('loading', newState === State.Loading);
      torchElem.classList.toggle('disabled', newState === State.Disabled);
      torchElem.classList.toggle('off', !on);
      statusMsgElem.textContent = newState;
      state = newState;

      if (track) {
        track.applyConstraints({advanced: [{torch: on}]}).catch(onError);
      }
    };

    try {
      updateState(State.Loading);

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
