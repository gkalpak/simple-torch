# Simple Torch


## Description

A simple torch [progressive web app (PWA)][mdn-pwa] using the [MediaDevices][mdn-media-devices] API.
To be used on mobile as a torch utility app, because I am fed up with existing apps.


## Usage

The app is available at https://gk-simple-torch.web.app/.

Once the app is loaded in a mobile browser supporting [PWAs][mdn-pwa], you can install the app on the home screen for
easier access. The app uses a [ServiceWorker][mdn-sw], so it can work offline (on supporting browsers).


## Contributing


### Local development

The following npm scripts are available and can help during local development:

- `build`: Build the app (in dev mode; see below).
- `build-prod`: Build the app (in production mode; see below).
- `clean-up`: Remove the output directory.<br />
  _(You shouldn't need to run this manually. It is run by other scripts as necessary.)_
- `dev`: Build (in dev mode), test and serve the app. Also, automatically reload and re-run tests whenever a file
  changes.<br />
  _(Useful during development.)_
- `generate-icons`: Generates several `simple-torch-<W>x<H>.png` icons (used as favicons and in `manifest.webmanifest`)
  based on `simple-torch.svg`. This needs to be manually run, when the logo (in SVG format) changes.
- `serve-prod`: Build (in production mode) and serve the app.<br />
  _(Unlike `dev` this does not watch the files for changes.)_

Building the app in production mode has the following differences:
1. The `ENV.production` global JavaScript variable is set to `true`.
2. The ServiceWorker script (`sw.js`) is also built.
3. The ServiceWorker is registered at runtime (as a result of the above).

> [!IMPORTANT]
> _Even if the app is built in dev mode, it may still be (temporarily) controlled by a previously installed
> ServiceWorker. To avoid surprises, the app is, by default, served on different ports based on the mode it is built
> in._

### Testing

The following npm scripts are available and can help during testing:

- `lint`: Lint the app and tests source code (TypeScript) and helper scripts (JavaScript) and type-check the helper
  scripts.<br />
  _(The source code is type-checked as part of the build process.)_
- `test`: Lint the code and run the automated tests (unit, end-to-end (e2e), web-app audits).
- `test-unit`: Build the app and run the unit tests.
- `test-e2e`: Build the app (in production mode) and run the end-to-end (e2e) tests.
- `test-web-app`: Build the app (in production mode) and audit it for things like performance, accessibility, best
  practices, SEO, PWA-readiness, etc. It uses [Lighthouse][lighthouse] and [webhint][webhint] under the hood.<br />
  _(You shouldn't need to run this manually. It is run by other scripts as necessary.)_

> [!WARNING]
> _Adding automated tests is still a work in progress._<br />
> _Specifically, e2e tests are currently minimal_ :scream:

### Releasing/Deploying

The following npm scripts are available and can help with releasing/deploying a new version of the app:

- `deploy`: Build the app (in production mode) and deploy it to Firebase.<br />
  _(You shouldn't need to run this manually. It is run as part of the `release` script.)_
- `release`: Cut a new version of the app and deploy it to production.


## TODO

Things I want to (but won't necessarily) do:

- Add more e2e tests (and update documentation for the `test` script).
- Consider adding snapshot/screenshot testing (different screen resolutions and states (torch on/off, muted/unmuted, etc.)).
  - Relevant resources:
    - https://nodejs.org/api/test.html#snapshot-testing
    - https://www.linkedin.com/pulse/implementing-visual-regression-testing-puppeteer-jest-cherish-dev-i3ave/
- Add CI support.


[mdn-media-devices]: https://developer.mozilla.org/en-US/docs/Web/API/MediaDevices
[mdn-pwa]: https://developer.mozilla.org/en-US/docs/Web/Progressive_web_apps
[mdn-sw]: https://developer.mozilla.org/en-US/docs/Web/API/Service_Worker_API
[lighthouse]: https://developers.google.com/web/tools/lighthouse
[run-lighthouse]: scripts/run-lighthouse.mjs
[webhint]: https://webhint.io/
