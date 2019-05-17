import {WIN} from '../shared/constants.js';
import {waitAndCheck} from '../shared/utils.js';
import {BaseCe, IInitializedCe} from './base.ce.js';


export class TorchCe extends BaseCe {
  protected static readonly template = `
    <h1>Torch</h1>
    <button class="torch-switch" disabled></button>
  `;
  protected static readonly style = `
    .torch-switch {
      background-color: gray;
      color: white;
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
      console.error(err);
      alert(`ERROR: ${err && err.message || err}`);

      updateBtn(false);
      btn.disabled = true;
      track = undefined;
    };
    const updateBtn = (on: boolean) => {
      btn.textContent = on ? 'ON' : 'OFF';
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

      btn.addEventListener('click', () => updateBtn(btn.textContent!.toLowerCase() === 'off'));
      btn.disabled = false;
      updateBtn(true);
    } catch (err) {
      onError(err);
    }

    return self;
  }
}
