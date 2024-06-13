import {ISettings, Settings} from '../../shared/settings.service.js';
import {BaseCe, IInitializedCe} from '../base.ce.js';


export class HeaderCe extends BaseCe {
  protected static override readonly template = `
    <header>
      <logo-ce class="logo"></logo-ce>
      <b>Simple Torch</b>
      <version-ce class="version"></version-ce>
      <flex-spacer-ce></flex-spacer-ce>
      <external-svg-ce class="speaker" src="assets/images/speaker.svg"></external-svg-ce>
    </header>
  `;
  protected static override readonly style = `
    :host {
      box-shadow: 0 6px 10px 0 rgba(0, 0, 0, 0.14),
                  0 1px 18px 0 rgba(0, 0, 0, 0.12);
    }

    header {
      align-items: center;
      /* To be kept in sync with \`manifest.webmanifest\` and \`index.html > meta[name="theme-color"]\`. */
      background-color: rgb(33, 33, 33);
      color: darkgray;
      display: flex;
      padding: 15px 10px;
    }

    .logo {
      height: 25px;
      margin-right: 10px;
      width: 25px;

      --simple-torch-outline-color: transparent;
    }

    .speaker {
      cursor: pointer;
      height: 25px;
      width: 25px;

      --speaker-color: slateblue;
      --speaker-cancel-line-color: darkred;
    }

    .version {
      font-size: small;
      margin-left: 10px;
    }
  `;

  private settings: ISettings = Settings.getInstance();

  protected override async initialize(): Promise<IInitializedCe<this>> {
    const self = await super.initialize();
    const speaker = self.shadowRoot.querySelector('.speaker')!;
    const updateSpeaker = () => speaker.classList.toggle('muted', this.settings.muted);

    speaker.addEventListener('click', () => {
      this.settings.muted = !this.settings.muted;
      updateSpeaker();
    });

    updateSpeaker();

    return self;
  }
}
