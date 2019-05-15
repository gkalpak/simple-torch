import {WIN} from '../shared/constants.js';
import {waitAndCheck} from '../shared/utils.js';
import {BaseCe} from './base.ce.js';


export class TorchCe extends BaseCe {
  static get _content() {
    return `
      <h1>Torch</h1>
      <button class="torch-switch"></button>
    `;
  }

  async _initialize() {
    await super._initialize();

    const btn = this.querySelector('.torch-switch');
    const updateBtn = on => {
      btn.textContent = on ? 'ON' : 'OFF';
      Object.assign(btn.style, {
        backgroundColor: on ? 'green' : 'darkred',
        color: 'white',
      });

      track.applyConstraints({advanced: [{torch: on}]});
    };

    const stream = await WIN.navigator.mediaDevices.getUserMedia({video: {facingMode: 'environment'}});
    const track = stream.getVideoTracks().pop();
    const hasTorch = await waitAndCheck(100, 25, () => track.getCapabilities().torch);

    if (!hasTorch) {
      updateBtn(false);
      btn.disabled = true;
      btn.style.opacity = 0.5;
    } else {
      updateBtn(true);
      btn.addEventListener('click', () =>
        updateBtn(btn.textContent.toLowerCase() === 'off'));
    }
  }
}
