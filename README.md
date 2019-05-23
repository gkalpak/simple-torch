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

- `build`: Build the app.
- `clean-up`: Remove the output directory.
  _(You shouldn't need to run this manually. It is run by other scripts as necessary.)_
- `dev`: Build, test and serve the app. Also, automatically reload and re-run tests whenever a file changes.
  _(Useful during development.)_
- `generate-favicon`: Generates `favicon.png` based on `simple-torch.svg`. This needs to be manually run, when the logo
  (in SVG format) changes.
- `serve`: Build and serve the app.
  _(Unlike `dev` this does not watch the files for changes.)_


### Testing

The following npm scripts are available and can help during testing:

- `lint`: Lint the source code.
- `test`: Lint the source code and run the automated tests.

_**NOTE**:_
_Adding automated tests is still a work in progress._
_Currently there are few unit tests and no end-to-end (e2e) tests :scream: :scream: :scream:_


### Releasing/Deploying

The following npm scripts are available and can help with releasing/deploying a new version of the app:

- `deploy`: Build the app and deploy it to Firebase.
  _(You shouldn't need to run this manually. It is run as part of the `release` script.)_
- `release`: Cut a new version of the app and deploy it to production.


## TODO

Things I want to (but won't necessarily) do:

- Refine functionality:
  - `TorchCe`:
    - Show loading spinner(?)
    - Update status message on error (and consider skipping alert).
    - Improve styling (torch size, status messages).
    - Improve torch interaction (e.g. slide switch instead of click).
    - Try to stop tracks/stream (and see if it makes a difference in mobile notifications).
  - Make it a PWA.
- Add more unit tests (and update documentation for the `test` script).
- Add e2e tests (and update documentation for the `test` script).
- Add CI support.


[mdn-media-devices]: https://developer.mozilla.org/en-US/docs/Web/API/MediaDevices
[mdn-pwa]: https://developer.mozilla.org/en-US/docs/Web/Progressive_web_apps
[mdn-sw]: https://developer.mozilla.org/en-US/docs/Web/API/Service_Worker_API
