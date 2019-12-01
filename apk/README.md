# Directory: `apk/`


## Description

This directory contains the artifacts of converting this PWA to an [Android Package (APK)][apk]
using [AppMaker's PWA2APK][pwa2apk].

> _**NOTE**:_<br />
> _The artifacts are intended for local use - not to be uploaded to [Google Play][google-play]._


## Files

Here is a list of files in this directory and their purpose (according to my limited understanding):

- `.gitignore`: Git's [.gitignore][gitignore] file, for ignoring files that I may have locally, but should not be
  committed and pushed upstream.
- `assetlinks.json`: This is the [Digital Asset Links][digital-asset-links] statement that is used to verify that the
  Android app and the web-site come from the same developer. It is expected to be available at
  `/.well-known/assetlinks.json`.
- `README.md`: This file, containing info about the directory.
- `Simple Torch.apk`: The [APK][apk].
  [signing the app][app-signing].
- `Simple Torch.zip`: A ZIP archive containing the [APK][apk]'s source code.

Here is a list of files that may be in this directory, but should not be committed and pushed upstream:

- `keystore.properties`: A file containing some keys and passwords that look related to the keystore and probably
  shouldn't be publicly accessible :D
- `Simple Torch.keystore`: A binary file that serves as a repository of certificates and private keys used for

<sub>If I have accidentally committed a file I shouldn't have, kindly let me know 🙏 😅</sub>


[apk]: https://en.wikipedia.org/wiki/Android_application_package
[app-signing]: https://developer.android.com/studio/publish/app-signing
[digital-asset-links]: https://developers.google.com/digital-asset-links
[gitignore]: https://git-scm.com/docs/gitignore
[google-play]: https://play.google.com/store
[pwa2apk]: https://appmaker.xyz/pwa-to-apk
