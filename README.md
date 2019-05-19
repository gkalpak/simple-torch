# Simple Torch


## Description

A simple torch [progressive web app (PWA)][mdn-pwa] using the [MediaDevices][mdn-media-devices] API.
To be used on mobile as a torch utility app, because I am fed up with existing apps.


## Usage

The app is available at https://gk-simple-torch.firebaseapp.com/.

Once the app is loaded in a mobile browser supporting [PWAs][mdn-pwa], you can install the app on the home screen for
easier access. The app uses a [ServiceWorker][mdn-sw], so it can work offline (on supporting browsers).


## Test

Currently there are no automated tests :scream: :scream: :scream:


## TODO

Things I want to (but won't necessarily) do:

- Refine functionality:
  - Show loading spinner in `ExternalSvgCe`.
  - Show loading spinner in `TorchCe`.
  - Use torch SVG in `TorchCe`.
  - Try to stop tracks/stream.
- Add unit tests.
- Add e2e tests.
- Add favicon.
- Add CI support.


[mdn-media-devices]: https://developer.mozilla.org/en-US/docs/Web/API/MediaDevices
[mdn-pwa]: https://developer.mozilla.org/en-US/docs/Web/Progressive_web_apps
[mdn-sw]: https://developer.mozilla.org/en-US/docs/Web/API/Service_Worker_API
