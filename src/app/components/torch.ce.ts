import {WIN} from '../shared/constants.js';
import {waitAndCheck} from '../shared/utils.js';
import {BaseCe, IInitializedCe} from './base.ce.js';


export class TorchCe extends BaseCe {
  protected static readonly template = `
    <h1>Torch</h1>
    <button class="torch-switch"></button>
  `;

  protected async initialize(): Promise<IInitializedCe<this>> {
    const self = await super.initialize();

    const stream = await WIN.navigator.mediaDevices.getUserMedia({video: {facingMode: 'environment'}});
    const track = stream.getVideoTracks().pop()!;
    const hasTorch = await waitAndCheck(100, 25, () => !!track.getCapabilities().torch);

    const btn = self.shadowRoot.querySelector<HTMLButtonElement>('.torch-switch')!;
    const updateBtn = (on: boolean) => {
      btn.textContent = on ? 'ON' : 'OFF';
      Object.assign(btn.style, {
        backgroundColor: on ? 'green' : 'darkred',
        color: 'white',
      });

      track.applyConstraints({advanced: [{torch: on}]});
    };

    if (!hasTorch) {
      updateBtn(false);
      btn.disabled = true;
      btn.style.opacity = '0.5';
    } else {
      updateBtn(true);
      btn.addEventListener('click', () =>
        updateBtn(btn.textContent!.toLowerCase() === 'off'));
    }

    return self;
  }
}
