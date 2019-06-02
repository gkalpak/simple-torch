# Simple Torch


## Description

A simple torch [progressive web app (PWA)][mdn-pwa] using the [MediaDevices][mdn-media-devices] API.
To be used on mobile as a torch utility app, because I am fed up with existing apps.


## Usage

The app is available at https://gk-simple-torch.firebaseapp.com/.

Once the app is loaded in a mobile browser supporting [PWAs][mdn-pwa], you can install the app on the home screen for
easier access. The app uses a [ServiceWorker][mdn-sw], so it can work offline (on supporting browsers).


## Contributing


### Local development

The following npm scripts are available and can help during local development:

- `build`: Build the app (in dev mode; see below).
- `build-prod`: Build the app (in production mode; see below).
- `clean-up`: Remove the output directory.
  _(You shouldn't need to run this manually. It is run by other scripts as necessary.)_
- `dev`: Build (in dev mode), test and serve the app. Also, automatically reload and re-run tests whenever a file
  changes.
  _(Useful during development.)_
- `generate-icons`: Generates several `simple-torch-<W>x<H>.png` icons (used as favicons and in `manifest.webmanifest`)
  based on `simple-torch.svg`. This needs to be manually run, when the logo (in SVG format) changes.
- `serve-prod`: Build (in production mode) and serve the app.
  _(Unlike `dev` this does not watch the files for changes.)_

Building the app in production mode has the following differences:
1. The `ENV.production` global JavaScript variable is set to `true`.
2. The ServiceWorker script (`sw.js`) is also built.
3. The ServiceWorker is registered at runtime (as a result of the above).

<sub>

_**NOTE**:_
_Even if the app is built in dev mode, it may still be (temporarily) controlled by a previously installed
ServiceWorker. To avoid surprises, the app is, by default, served on different ports based on the mode is built in._

</sub>

### Testing

The following npm scripts are available and can help during testing:

- `audit-web-app`: Audit a web-app (at the provided URL) for things like performance, accessibility, best practices,
  PWA-readiness and SEO. It uses [Lighthouse][lighthouse] under the hood. See,
  [scripts/audit-web-app.js][audit-web-app] for usage instructions.
  _(You shouldn't need to run this manually. It is run by other scripts as necessary.)_
- `lint`: Lint the app source code (TypeScript) and helper scripts (JavaScript).
- `test`: Lint the code and run the automated tests (unit, end-to-end (e2e), web-app audits).

<sub>

_**NOTE**:_
_Adding automated tests is still a work in progress._
_Currently there are unit tests but no e2e tests :scream: :scream: :scream:_

</sub>

### Releasing/Deploying

The following npm scripts are available and can help with releasing/deploying a new version of the app:

- `deploy`: Build the app (in production mode) and deploy it to Firebase.
  _(You shouldn't need to run this manually. It is run as part of the `release` script.)_
- `release`: Cut a new version of the app and deploy it to production.


## TODO

Things I want to (but won't necessarily) do:

- Add `BaseCe#dispose()` (no-op) and `TorchCe#dispose()` (e.g. remove event listener on `document`).
- Add e2e tests (and update documentation for the `test` script).
  - Also, verify `ENV`.
  Relevant resources:
  - https://www.protractortest.org/#/api?view=ProtractorBy.prototype.addLocator
  - https://gist.github.com/ChadKillingsworth/d4cb3d30b9d7fbc3fd0af93c2a133a53
- Consider adding snapshot/screenshot testing (different screen resolutions and states (torch on/off, muted/unmuted, etc.)).
  Relevant resources:
  - https://www.npmjs.com/package/protractor-image-comparison
- Add CI support.


[audit-web-app]: scripts/audit-web-app.js
[mdn-media-devices]: https://developer.mozilla.org/en-US/docs/Web/API/MediaDevices
[mdn-pwa]: https://developer.mozilla.org/en-US/docs/Web/Progressive_web_apps
[mdn-sw]: https://developer.mozilla.org/en-US/docs/Web/API/Service_Worker_API
[lighthouse]: https://developers.google.com/web/tools/lighthouse
