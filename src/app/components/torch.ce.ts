import {WIN} from '../shared/constants.js';
import {waitAndCheck} from '../shared/utils.js';
import {BaseCe, IInitializedCe} from './base.ce.js';


const enum State {
  Loading = 'loading',
  Disabled = 'not available' ,
  Off = 'off',
  On = 'on',
}

export class TorchCe extends BaseCe {
  protected static readonly template = `
    <h1>Torch</h1>
    <button class="torch-switch" disabled>${State.Loading}...</button>
  `;
  protected static readonly style = `
    .torch-switch {
      background-color: gray;
      color: white;
      text-transform: capitalize;
    }
    .torch-switch.off { background-color: darkred; }
    .torch-switch.on { background-color: green; }
    .torch-switch[disabled] { opacity: 0.5; }
  `;

  protected async initialize(): Promise<IInitializedCe<this>> {
    const self = await super.initialize();
    const btn = self.shadowRoot.querySelector<HTMLButtonElement>('.torch-switch')!;
    let track: MediaStreamTrack | undefined;

    const onError = (err: any) => {
      this.onError(err);

      btn.disabled = true;
      track = undefined;
      updateState(State.Disabled);
    };
    const updateState = (state: State) => {
      const on = state === State.On;

      btn.textContent = state;
      btn.classList.toggle('off', !on);
      btn.classList.toggle('on', on);

      if (track) {
        track.applyConstraints({advanced: [{torch: on}]}).catch(onError);
      }
    };

    try {
      const stream = await WIN.navigator.mediaDevices.
        getUserMedia({video: {facingMode: 'environment'}}).
        catch(() => undefined);
      track = stream && stream.getVideoTracks().pop();
      const hasTorch = !!track && await waitAndCheck(100, 25, () => !!track!.getCapabilities().torch);

      if (!hasTorch) {
        throw new Error('Unable to access camera or torch.');
      }

      btn.addEventListener('click', () =>
        updateState((btn.textContent!.toLowerCase() === 'off') ? State.On : State.Off));
      btn.disabled = false;
      updateState(State.On);
    } catch (err) {
      onError(err);
    }

    return self;
  }
}
