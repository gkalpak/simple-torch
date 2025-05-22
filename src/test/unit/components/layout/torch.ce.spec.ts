/* eslint-disable max-classes-per-file */

import {BaseCe, IInitializedCe} from '../../../../app/js/components/base.ce.js';
import {EMPTY_TORCH_INFO, State, TorchCe} from '../../../../app/js/components/layout/torch.ce.js';
import {LoaderCe} from '../../../../app/js/components/shared/loader.ce.js';
import {EMOJI, WIN} from '../../../../app/js/shared/constants.js';
import {ISettings, Settings} from '../../../../app/js/shared/settings.service.js';
import {Sounds} from '../../../../app/js/shared/sounds.service.js';
import {
  microtick,
  mockProperty,
  normalizeWhitespace,
  reversePromise,
  setupCeContainer,
  spyProperty,
} from '../../test-utils.js';


describe('TorchCe', () => {
  const initCe = setupCeContainer();
  let mockSettings: ISettings;
  let getTorchInfoSpy: jasmine.Spy;
  let onErrorSpy: jasmine.Spy;

  beforeAll(() => TestTorchCe.register());

  beforeEach(() => {
    mockSettings = {muted: false, torchDeviceId: '', unset: jasmine.createSpy('unset')};
    spyOn(Settings, 'getInstance').and.returnValue(mockSettings);
    getTorchInfoSpy = spyOn(TestTorchCe.prototype, 'getTorchInfo').and.resolveTo(EMPTY_TORCH_INFO);
    onErrorSpy = spyOn(TestTorchCe.prototype, 'onError');
  });

  it('should extend `BaseCe`', async () => {
    const elem = await initCe(TestTorchCe);

    expect(elem).toEqual(jasmine.any(TorchCe));
    expect(elem).toEqual(jasmine.any(BaseCe));
  });

  it('should display a (dark) torch', async () => {
    const elem = await initCe(TestTorchCe);
    const torch = elem.shadowRoot.querySelector<HTMLUnknownElement>('external-svg-ce')!;

    expect(torch).not.toBeNull();
    expect(torch.getAttribute('src')).toBe('assets/images/simple-torch.svg');
    expect(torch.classList.contains('dark')).toBe(true);
    expect(torch.classList.contains('uninitialized')).toBe(false);
  });

  it('should display a loader, while not initialized', async () => {
    const elem = await initCe(TestTorchCe);
    const loader = elem.shadowRoot.querySelector<HTMLUnknownElement>(LoaderCe.tagName)!;

    expect(loader).not.toBeNull();
  });

  it('should display a status', async () => {
    const elem = await initCe(TestTorchCe);
    const status = elem.shadowRoot.querySelector<HTMLDivElement>('.status')!;

    expect(status).not.toBeNull();
    expect(normalizeWhitespace(status.textContent)).toBe(`Status: INITIALIZING... ${EMOJI.hourglassNotDone}`);
  });

  describe('#acquireCameraPermission()', () => {
    let mockMediaDevices: MockMediaDevices;
    let getUserMediaSpy: jasmine.Spy;
    let permissionsQuerySpy: jasmine.Spy;
    let elem: TestTorchCe;

    beforeEach(() => {
      mockMediaDevices = new MockMediaDevices();

      spyOnProperty(WIN.navigator, 'mediaDevices').and.returnValue(mockMediaDevices as unknown as MediaDevices);
      getUserMediaSpy = spyOn(mockMediaDevices, 'getUserMedia').and.callThrough();
      permissionsQuerySpy = spyOn(WIN.navigator.permissions, 'query').and.resolveTo(new MockPermissionStatus('denied'));

      elem = new TestTorchCe();
    });

    it('should resolve if permission is already granted', async () => {
      permissionsQuerySpy.and.resolveTo(new MockPermissionStatus('granted'));

      await expectAsync(elem.acquireCameraPermission()).toBeResolved();
      expect(getUserMediaSpy).not.toHaveBeenCalled();
    });

    it('should reject if permission is already denied', async () => {
      permissionsQuerySpy.and.resolveTo(new MockPermissionStatus('denied'));

      await expectAsync(elem.acquireCameraPermission()).toBeRejectedWithError(
          'Unable to access camera. If supported on your device, please give permission in browser settings.');
      expect(getUserMediaSpy).not.toHaveBeenCalled();
    });

    it('should resolve after prompting the user if permission is freshly granted', async () => {
      permissionsQuerySpy.and.resolveTo(new MockPermissionStatus('prompt'));

      await expectAsync(elem.acquireCameraPermission()).toBeResolved();
      expect(getUserMediaSpy).toHaveBeenCalledOnceWith({video: true});
    });

    it('should reject after prompting the user if permission is freshly denied', async () => {
      // Ensure there is no video input (i.e. camera).
      mockMediaDevices.$devicesWithSpecs = new Map();
      permissionsQuerySpy.and.resolveTo(new MockPermissionStatus('prompt'));

      await expectAsync(elem.acquireCameraPermission()).toBeRejectedWithError(
          'Unable to access camera. If supported on your device, please give permission in browser settings.');
      expect(getUserMediaSpy).toHaveBeenCalledOnceWith({video: true});
    });

    it('should resolve if querying for `camera` permission is not supported but permission is granted', async () => {
      permissionsQuerySpy.and.rejectWith('Unknown permission');

      await expectAsync(elem.acquireCameraPermission()).toBeResolved();
      expect(getUserMediaSpy).toHaveBeenCalledOnceWith({video: true});
    });

    it('should reject if querying for `camera` permission is not supported and permission is denied', async () => {
      // Ensure there is no video input (i.e. camera).
      mockMediaDevices.$devicesWithSpecs = new Map();
      permissionsQuerySpy.and.rejectWith('Unknown permission');

      await expectAsync(elem.acquireCameraPermission()).toBeRejectedWithError(
          'Unable to access camera. If supported on your device, please give permission in browser settings.');
      expect(getUserMediaSpy).toHaveBeenCalledOnceWith({video: true});
    });
  });

  describe('#getTorchInfo()', () => {
    let mockMediaDevices: MockMediaDevices;
    let getUserMediaSpy: jasmine.Spy;
    let acquireCameraPermissionSpy: jasmine.Spy;
    let elem: TestTorchCe;

    beforeEach(async () => {
      mockMediaDevices = new MockMediaDevices();

      spyOnProperty(WIN.navigator, 'mediaDevices').and.returnValue(mockMediaDevices as unknown as MediaDevices);
      getUserMediaSpy = spyOn(mockMediaDevices, 'getUserMedia').and.callThrough();
      acquireCameraPermissionSpy = spyOn(TestTorchCe.prototype, 'acquireCameraPermission').and.resolveTo();
      getTorchInfoSpy.and.callThrough();

      elem = new TestTorchCe();
    });

    describe('(with `renewIfNecessary: false`)', () => {
      it('should retrieve and return the existing torch info', async () => {
        await initCe(elem);
        getUserMediaSpy.calls.reset();
        acquireCameraPermissionSpy.calls.reset();

        const torchInfo = await elem.getTorchInfo();

        expect(torchInfo).toEqual({
          hasCamera: true,
          hasTorch: true,
          screenWakeLock: undefined,
          track: jasmine.any(MockMediaStreamTrack),
        });
        expect(getUserMediaSpy).not.toHaveBeenCalled();
        expect(acquireCameraPermissionSpy).not.toHaveBeenCalled();
      });

      describe('if there is no track info', () => {
        it('should return empty torch info', async () => {
          const torchInfo = await elem.getTorchInfo();

          expect(torchInfo).toEqual(EMPTY_TORCH_INFO);
          expect(getUserMediaSpy).not.toHaveBeenCalled();
          expect(acquireCameraPermissionSpy).not.toHaveBeenCalled();
        });

        it('should release the screen wake lock', async () => {
          const releaseScreenWakeLockSpy = spyOn(TestTorchCe.prototype, 'releaseScreenWakeLock');

          const torchInfo = await elem.getTorchInfo();

          expect(torchInfo).toEqual(EMPTY_TORCH_INFO);
          expect(releaseScreenWakeLockSpy).toHaveBeenCalledWith(torchInfo);
        });
      });

      describe('if the previous track has been stopped', () => {
        it('should return empty torch info', async () => {
          await initCe(elem);
          const torchInfo1 = await elem.getTorchInfo();

          torchInfo1.track?.stop();
          getUserMediaSpy.calls.reset();
          acquireCameraPermissionSpy.calls.reset();

          const torchInfo2 = await elem.getTorchInfo();

          expect(torchInfo1).not.toEqual(EMPTY_TORCH_INFO);
          expect(torchInfo2).toEqual(EMPTY_TORCH_INFO);
          expect(getUserMediaSpy).not.toHaveBeenCalled();
          expect(acquireCameraPermissionSpy).not.toHaveBeenCalled();
        });

        it('should release the screen wake lock', async () => {
          const releaseScreenWakeLockSpy = spyOn(TestTorchCe.prototype, 'releaseScreenWakeLock');

          await initCe(elem);
          const torchInfo1 = await elem.getTorchInfo();

          torchInfo1.track?.stop();
          getUserMediaSpy.calls.reset();
          acquireCameraPermissionSpy.calls.reset();
          releaseScreenWakeLockSpy.calls.reset();

          const torchInfo2 = await elem.getTorchInfo();

          expect(torchInfo1).not.toEqual(EMPTY_TORCH_INFO);
          expect(torchInfo2).toEqual(EMPTY_TORCH_INFO);
          expect(releaseScreenWakeLockSpy).toHaveBeenCalledOnceWith(torchInfo1);
        });
      });
    });

    describe('(with `renewIfNecessary: true`)', () => {
      it('should get a new track, if there is currently no track', async () => {
        const torchInfo = await elem.getTorchInfo(true);

        expect(torchInfo).toEqual({
          hasCamera: true,
          hasTorch: true,
          screenWakeLock: undefined,
          track: jasmine.any(MockMediaStreamTrack),
        });
        expect(acquireCameraPermissionSpy).toHaveBeenCalledOnceWith();
        expect(getUserMediaSpy).toHaveBeenCalledWith({video: {deviceId: {exact: jasmine.any(String)}}});
      });

      it('should release the screen wake lock, if there is no active track', async () => {
        const releaseScreenWakeLockSpy = spyOn(TestTorchCe.prototype, 'releaseScreenWakeLock');

        const torchInfo1 = await elem.getTorchInfo(true);
        torchInfo1.track?.stop();

        releaseScreenWakeLockSpy.calls.reset();
        const torchInfo2 = await elem.getTorchInfo(true);

        expect(torchInfo2).not.toBe(torchInfo1);
        expect(releaseScreenWakeLockSpy).toHaveBeenCalledOnceWith(torchInfo1);

        releaseScreenWakeLockSpy.calls.reset();
        torchInfo2.track = undefined;
        const torchInfo3 = await elem.getTorchInfo(true);

        expect(torchInfo3).not.toBe(torchInfo2);
        expect(releaseScreenWakeLockSpy).toHaveBeenCalledOnceWith(torchInfo2);
      });

      it('should return the same torch info, if no renewal is required', async () => {
        const torchInfo1 = await elem.getTorchInfo(true);

        acquireCameraPermissionSpy.calls.reset();
        getUserMediaSpy.calls.reset();

        const torchInfo2 = await elem.getTorchInfo(true);

        expect(torchInfo2).toBe(torchInfo1);
        expect(torchInfo2).toEqual({
          hasCamera: true,
          hasTorch: true,
          screenWakeLock: undefined,
          track: jasmine.any(MockMediaStreamTrack),
        });
        expect(acquireCameraPermissionSpy).not.toHaveBeenCalled();
        expect(getUserMediaSpy).not.toHaveBeenCalled();
      });

      it('should renew the track, if the previous track has been stopped', async () => {
        const torchInfo1 = await elem.getTorchInfo(true);

        torchInfo1.track?.stop();
        acquireCameraPermissionSpy.calls.reset();
        getUserMediaSpy.calls.reset();

        const torchInfo2 = await elem.getTorchInfo(true);

        expect(torchInfo2).not.toBe(torchInfo1);
        expect(torchInfo2).toEqual({
          hasCamera: true,
          hasTorch: true,
          screenWakeLock: undefined,
          track: jasmine.any(MockMediaStreamTrack),
        });
        expect(acquireCameraPermissionSpy).toHaveBeenCalledOnceWith();
        expect(getUserMediaSpy).toHaveBeenCalledWith({video: {deviceId: {exact: jasmine.any(String)}}});
      });

      it('should reject if permission to camera is denied', async () => {
        acquireCameraPermissionSpy.and.rejectWith('Permission denied.');

        await expectAsync(elem.getTorchInfo(true)).toBeRejectedWith('Permission denied.');
      });

      it('should return empty torch info, if there is no camera', async () => {
        mockMediaDevices.$devicesWithSpecs = new Map([
          [new TestDeviceInfo('audiooutput', 'spkr-001'), {}],
          [new TestDeviceInfo('audiooutput', 'spkr-002'), {}],
          [new TestDeviceInfo('audioinput', 'mic-001'), {}],
          [new TestDeviceInfo('audioinput', 'mic-002'), {}],
        ]);

        expect(await elem.getTorchInfo(true)).toEqual({
          hasCamera: false,
          hasTorch: false,
          screenWakeLock: undefined,
          track: undefined,
        });
      });

      it('should return empty torch info, if there is no camera with torch', async () => {
        mockMediaDevices.$devicesWithSpecs = new Map([
          [new TestDeviceInfo('videoinput', 'cam-001'), {}],
          [new TestDeviceInfo('videoinput', 'cam-002'), {}],
        ]);

        expect(await elem.getTorchInfo(true)).toEqual({
          hasCamera: true,
          hasTorch: false,
          screenWakeLock: undefined,
          track: undefined,
        });
      });

      it('should try all video input devices to find one that supports torch', async () => {
        mockMediaDevices.$devicesWithSpecs = new Map([
          [new TestDeviceInfo('audiooutput', 'spkr-001'), {}],
          [new TestDeviceInfo('audioinput', 'mic-001'), {}],
          [new TestDeviceInfo('videoinput', 'cam-001'), {}],
          [new TestDeviceInfo('audiooutput', 'spkr-002'), {}],
          [new TestDeviceInfo('audioinput', 'mic-002'), {}],
          [new TestDeviceInfo('videoinput', 'cam-002'), {}],
          [new TestDeviceInfo('audiooutput', 'spkr-003'), {}],
          [new TestDeviceInfo('audioinput', 'mic-003'), {}],
          [new TestDeviceInfo('videoinput', 'cam-003'), {}],
        ]);

        await elem.getTorchInfo(true);

        expect(getUserMediaSpy).toHaveBeenCalledTimes(3);
        expect(getUserMediaSpy).toHaveBeenCalledWith({video: {deviceId: {exact: 'cam-001'}}});
        expect(getUserMediaSpy).toHaveBeenCalledWith({video: {deviceId: {exact: 'cam-002'}}});
        expect(getUserMediaSpy).toHaveBeenCalledWith({video: {deviceId: {exact: 'cam-003'}}});
      });

      it('should try video input devices in reverse order', async () => {
        mockMediaDevices.$devicesWithSpecs = new Map([
          [new TestDeviceInfo('videoinput', 'cam-001'), {}],
          [new TestDeviceInfo('videoinput', 'cam-002'), {}],
          [new TestDeviceInfo('videoinput', 'cam-003'), {}],
        ]);

        await elem.getTorchInfo(true);

        expect(getUserMediaSpy.calls.allArgs()).toEqual([
          [{video: {deviceId: {exact: 'cam-003'}}}],
          [{video: {deviceId: {exact: 'cam-002'}}}],
          [{video: {deviceId: {exact: 'cam-001'}}}],
        ]);
      });

      it('should stop trying video input devices as soon as it finds one that supports torch', async () => {
        mockMediaDevices.$devicesWithSpecs = new Map([
          [new TestDeviceInfo('videoinput', 'cam-001'), {torch: true}],
          [new TestDeviceInfo('videoinput', 'cam-002'), {torch: true}],
          [new TestDeviceInfo('videoinput', 'cam-003'), {}],
        ]);

        await elem.getTorchInfo(true);

        expect(getUserMediaSpy.calls.allArgs()).toEqual([
          [{video: {deviceId: {exact: 'cam-003'}}}],
          [{video: {deviceId: {exact: 'cam-002'}}}],
        ]);
      });

      it('should stop tracks that do not support torch', async () => {
        mockMediaDevices.$devicesWithSpecs = new Map([
          [new TestDeviceInfo('videoinput', 'cam-001'), {}],
          [new TestDeviceInfo('videoinput', 'cam-002'), {}],
          [new TestDeviceInfo('videoinput', 'cam-003'), {}],
        ]);

        await elem.getTorchInfo(true);
        const tracks = await Promise.
          all(getUserMediaSpy.calls.all().map(x => x.returnValue as Promise<MockMediaStream>)).
          then(mockStreams => mockStreams.map(x => x.$track));

        expect(tracks.length).toBe(3);
        expect(tracks.map(x => x.readyState)).toEqual(['ended', 'ended', 'ended']);
      });

      it('should not stop the track that does support torch', async () => {
        mockMediaDevices.$devicesWithSpecs = new Map([
          [new TestDeviceInfo('videoinput', 'cam-001'), {torch: true}],
          [new TestDeviceInfo('videoinput', 'cam-002'), {}],
          [new TestDeviceInfo('videoinput', 'cam-003'), {}],
        ]);

        await elem.getTorchInfo(true);
        const tracks = await Promise.
          all(getUserMediaSpy.calls.all().map(x => x.returnValue as Promise<MockMediaStream>)).
          then(mockStreams => mockStreams.map(x => x.$track));

        expect(tracks.length).toBe(3);
        expect(tracks.map(x => x.readyState)).toEqual(['ended', 'ended', 'live']);
      });

      it('should store a matched video input device in settings', async () => {
        mockMediaDevices.$devicesWithSpecs = new Map([
          [new TestDeviceInfo('videoinput', 'cam-001'), {torch: true}],
          [new TestDeviceInfo('videoinput', 'cam-002'), {torch: true}],
          [new TestDeviceInfo('videoinput', 'cam-003'), {}],
        ]);

        await elem.getTorchInfo(true);

        expect(mockSettings.torchDeviceId).toBe('cam-002');
      });

      it('should try a stored matched video input device from settings first', async () => {
        mockSettings.torchDeviceId = 'cam-002';
        mockMediaDevices.$devicesWithSpecs = new Map([
          [new TestDeviceInfo('videoinput', 'cam-001'), {}],
          [new TestDeviceInfo('videoinput', 'cam-002'), {torch: true}],
          [new TestDeviceInfo('videoinput', 'cam-003'), {}],
        ]);

        await elem.getTorchInfo(true);

        expect(mockSettings.torchDeviceId).toBe('cam-002');
        expect(mockSettings.unset).not.toHaveBeenCalled();
        expect(getUserMediaSpy.calls.allArgs()).toEqual(jasmine.arrayWithExactContents([
          [{video: {deviceId: {exact: 'cam-002'}}}],
        ]));
      });

      it('should try other devices if a stored matched video input device from settings does not work', async () => {
        mockSettings.torchDeviceId = 'cam-003';
        mockMediaDevices.$devicesWithSpecs = new Map([
          [new TestDeviceInfo('videoinput', 'cam-001'), {}],
          [new TestDeviceInfo('videoinput', 'cam-002'), {torch: true}],
          [new TestDeviceInfo('videoinput', 'cam-003'), {}],
          [new TestDeviceInfo('videoinput', 'cam-004'), {}],
        ]);

        await elem.getTorchInfo(true);

        expect(mockSettings.torchDeviceId).toBe('cam-002');
        expect(mockSettings.unset).not.toHaveBeenCalled();
        expect(getUserMediaSpy.calls.allArgs()).toEqual(jasmine.arrayWithExactContents([
          [{video: {deviceId: {exact: 'cam-003'}}}],
          [{video: {deviceId: {exact: 'cam-004'}}}],
          [{video: {deviceId: {exact: 'cam-002'}}}],
        ]));
      });

      it('should not try a stored matched video input device from settings that no longer exists', async () => {
        mockSettings.torchDeviceId = 'cam-002';
        mockMediaDevices.$devicesWithSpecs = new Map([
          [new TestDeviceInfo('videoinput', 'cam-001'), {}],
          [new TestDeviceInfo('videoinput', 'cam-003'), {}],
        ]);

        await elem.getTorchInfo(true);

        expect(mockSettings.unset).toHaveBeenCalledWith('torchDeviceId');
        expect(getUserMediaSpy.calls.allArgs()).toEqual(jasmine.arrayWithExactContents([
          [{video: {deviceId: {exact: 'cam-003'}}}],
          [{video: {deviceId: {exact: 'cam-001'}}}],
        ]));
      });


      it('should not try a stored matched video input device from settings that is not a camera', async () => {
        mockSettings.torchDeviceId = 'cam-002';
        mockMediaDevices.$devicesWithSpecs = new Map([
          [new TestDeviceInfo('videoinput', 'cam-001'), {}],
          [new TestDeviceInfo('audioinput', 'cam-002'), {}],
          [new TestDeviceInfo('videoinput', 'cam-003'), {}],
        ]);

        await elem.getTorchInfo(true);

        expect(mockSettings.unset).toHaveBeenCalledWith('torchDeviceId');
        expect(getUserMediaSpy.calls.allArgs()).toEqual(jasmine.arrayWithExactContents([
          [{video: {deviceId: {exact: 'cam-003'}}}],
          [{video: {deviceId: {exact: 'cam-001'}}}],
        ]));
      });
    });
  });

  describe('#initialize()', () => {
    let elem: TestTorchCe;

    beforeEach(() => elem = new TestTorchCe());

    it('should set the state to `Initializing` at the beginning', async () => {
      const {installSpies, setSpy: setStateSpy} = spyProperty(elem, 'state');
      installSpies();

      await initCe(elem);

      expect(setStateSpy).toHaveBeenCalledWith(State.Initializing);
      expect(setStateSpy).toHaveBeenCalledBefore(getTorchInfoSpy);
    });

    it('should retrieve the torch info', async () => {
      await initCe(elem);
      expect(getTorchInfoSpy).toHaveBeenCalledWith(true);
    });

    it('should report an error, if retrieving the torch info fails', async () => {
      getTorchInfoSpy.and.throwError('`getTorchInfo()` failed');
      await initCe(elem);

      expect(onErrorSpy).toHaveBeenCalledWith(new Error('`getTorchInfo()` failed'));
    });

    it('should report an error, if switching the torch on fails', async () => {
      const mockTrack = new MockMediaStreamTrack(true);

      spyOn(mockTrack, 'applyConstraints').and.throwError('`applyConstraints()` failed');
      getTorchInfoSpy.and.resolveTo({hasTorch: true, track: mockTrack});

      await initCe(elem);

      expect(onErrorSpy).toHaveBeenCalledWith(new Error('`applyConstraints()` failed'));
    });

    describe('(with camera/torch/permission)', () => {
      let mockTrack: MockMediaStreamTrack;
      let onVisibilityChangeSpy: jasmine.Spy;

      beforeEach(() => {
        mockTrack = new MockMediaStreamTrack(true);

        onVisibilityChangeSpy = spyOn(elem, 'onVisibilityChange');
        getTorchInfoSpy.and.resolveTo({hasCamera: true, hasTorch: true, screenWakeLock: undefined, track: mockTrack});
      });

      it('should set the state to `On`', async () => {
        const {installSpies, setSpy: setStateSpy} = spyProperty(elem, 'state');
        installSpies();

        await initCe(elem);

        expect(setStateSpy).toHaveBeenCalledTimes(2);
        expect(setStateSpy.calls.mostRecent().args).toEqual([State.On]);
        expect(mockTrack.isTorchOn()).toBe(true);
      });

      it('should add a listener on `document` for `visibilitychange`', async () => {
        const evt = new Event('visibilitychange');

        WIN.document.dispatchEvent(evt);
        expect(onVisibilityChangeSpy).not.toHaveBeenCalled();

        await initCe(elem);

        WIN.document.dispatchEvent(evt);
        expect(onVisibilityChangeSpy).toHaveBeenCalledTimes(1);

        WIN.document.dispatchEvent(evt);
        expect(onVisibilityChangeSpy).toHaveBeenCalledTimes(2);
      });

      it('should register a clean-up function to remove the `visibilitychange` listener from `document`', async () => {
        const evt = new Event('visibilitychange');
        await initCe(elem);

        WIN.document.dispatchEvent(evt);
        expect(onVisibilityChangeSpy).toHaveBeenCalledTimes(1);

        onVisibilityChangeSpy.calls.reset();
        elem.disconnectedCallback();

        WIN.document.dispatchEvent(evt);
        expect(onVisibilityChangeSpy).not.toHaveBeenCalled();
      });

      it('should register a clean-up function to stop the track (if active)', async () => {
        await initCe(elem);
        expect(mockTrack.readyState).toBe('live');

        elem.disconnectedCallback();
        await microtick();
        expect(mockTrack.readyState).toBe('ended');
      });

      it('should register a clean-up function to release the screen wake lock (if active)', async () => {
        await initCe(elem);

        const mockWakeLock = new MockWakeLockSentinel('screen');
        getTorchInfoSpy.and.resolveTo({
          hasCamera: true,
          hasTorch: true,
          screenWakeLock: mockWakeLock,
          track: undefined,
        });

        expect(mockWakeLock.released).toBe(false);

        elem.disconnectedCallback();
        await microtick();
        expect(mockWakeLock.released).toBe(true);
      });
    });

    describe('(without camera/torch/permission)', () => {
      let onVisibilityChangeSpy: jasmine.Spy;

      beforeEach(() => onVisibilityChangeSpy = spyOn(elem, 'onVisibilityChange'));

      it('should abort and report an error, when no torch detected', async () => {
        getTorchInfoSpy.and.resolveTo({
          hasCamera: true,
          hasTorch: false,
          screenWakeLock: undefined,
          track: new MockMediaStreamTrack(),
        });

        await initCe(elem);
        WIN.document.dispatchEvent(new Event('visibilitychange'));

        expect(elem.state).not.toBe(State.On);
        expect(onVisibilityChangeSpy).not.toHaveBeenCalled();
        expect(onErrorSpy).toHaveBeenCalledWith(new Error('Unable to detect torch on your device.'));
      });

      it('should abort and report an error, when no camera detected', async () => {
        getTorchInfoSpy.and.resolveTo(EMPTY_TORCH_INFO);

        await initCe(elem);
        WIN.document.dispatchEvent(new Event('visibilitychange'));

        expect(elem.state).not.toBe(State.On);
        expect(onVisibilityChangeSpy).not.toHaveBeenCalled();
        expect(onErrorSpy).toHaveBeenCalledWith(new Error('Unable to detect camera on your device.'));
      });

      it('should abort and report an error, when permission not granted', async () => {
        const mockError = new Error('Permission not granted.');
        getTorchInfoSpy.and.throwError(mockError);

        await initCe(elem);
        WIN.document.dispatchEvent(new Event('visibilitychange'));

        expect(elem.state).not.toBe(State.On);
        expect(onVisibilityChangeSpy).not.toHaveBeenCalled();
        expect(onErrorSpy).toHaveBeenCalledWith(mockError);
      });
    });
  });

  describe('#onClick()', () => {
    const clickSound = Sounds.getInstance().getSound('assets/audio/click.ogg', 0.15);
    let elem: TestTorchCe;
    let clickPlaySpy: jasmine.Spy;
    let updateStateSpy: jasmine.Spy;

    beforeEach(async () => {
      elem = await initCe(TestTorchCe);
      clickPlaySpy = spyOn(clickSound, 'play');
      updateStateSpy = spyOn(elem, 'updateState').and.resolveTo();
    });

    it('should play a click sound, unless muted', async () => {
      mockSettings.muted = false;

      await elem.onClick();
      expect(clickPlaySpy).toHaveBeenCalledTimes(1);

      await elem.onClick();
      expect(clickPlaySpy).toHaveBeenCalledTimes(2);

      mockSettings.muted = true;
      clickPlaySpy.calls.reset();

      await elem.onClick();
      await elem.onClick();
      expect(clickPlaySpy).not.toHaveBeenCalled();
    });

    it('should update the state', async () => {
      const test = async (oldState: State, newState: State) => {
        updateStateSpy.calls.reset();
        elem.state = oldState;

        await elem.onClick();

        expect(updateStateSpy).toHaveBeenCalledOnceWith(newState);
      };

      await test(State.Uninitialized, State.Off);
      await test(State.Initializing, State.Off);
      await test(State.Disabled, State.Off);
      await test(State.Off, State.On);
      await test(State.On, State.Off);
    });

    it('should pass `updateState()` error to `onError()`', async () => {
      updateStateSpy.and.rejectWith('test');
      await elem.onClick();

      expect(onErrorSpy).toHaveBeenCalledWith('test');
    });
  });

  describe('#onError()', () => {
    let elem: TestTorchCe;
    let superOnErrorSpy: jasmine.Spy;

    beforeEach(async () => {
      elem = await initCe(TestTorchCe);

      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      superOnErrorSpy = spyOn(BaseCe.prototype as any, 'onError').and.
        callFake((err: unknown) => (err instanceof Error) ? err : new Error(`${err}`));
      onErrorSpy.and.callThrough();
    });

    it('should forward the error to `super.onError()`', async () => {
      const err = new Error('test');
      await elem.onError(err);

      expect(superOnErrorSpy).toHaveBeenCalledWith(err);
    });

    it('should stop the track (if any)', async () => {
      const mockTrack = new MockMediaStreamTrack();
      getTorchInfoSpy.and.resolveTo({track: mockTrack});

      expect(mockTrack.readyState).toBe('live');

      await elem.onError(new Error('test'));
      expect(mockTrack.readyState).toBe('ended');
    });

    it('should release the screen wake lock (if any)', async () => {
      const mockWakeLock = new MockWakeLockSentinel('screen');
      getTorchInfoSpy.and.resolveTo({screenWakeLock: mockWakeLock});

      expect(mockWakeLock.released).toBe(false);

      await elem.onError(new Error('test'));
      expect(mockWakeLock.released).toBe(true);
    });

    it('should set the state to `Disabled`', async () => {
      const updateStateSpy = spyOn(elem, 'updateState');
      await elem.onError(new Error('test'));

      expect(updateStateSpy).toHaveBeenCalledWith(State.Disabled, 'test');
    });
  });

  describe('#onVisibilityChange()', () => {
    interface IMockPartialTorchInfo {
      screenWakeLock: MockWakeLockSentinel | undefined;
      track: MockMediaStreamTrack | undefined;
    }

    interface IOnVisibilityChangeTestCase {
      description: string;
      initialState: State;
      getInitialPartialInfo: () => IMockPartialTorchInfo;
      verifyOutcome: (initialInfo: IMockPartialTorchInfo, finalInfo: IMockPartialTorchInfo) => Promise<void>;
    }

    const {setMockValue: setMockHidden} = mockProperty(WIN.document, 'hidden');
    const createMockTrack = (stopped = false) =>
      Object.assign(new MockMediaStreamTrack(true), stopped && {readyState: 'ended'});
    const createMockWakeLock = (released = false) =>
      Object.assign(new MockWakeLockSentinel('screen'), {released});
    const testCases: IOnVisibilityChangeTestCase[] = [
      {
        description: '(state: Off, track: none)',
        initialState: State.Off,

        getInitialPartialInfo: () => ({screenWakeLock: createMockWakeLock(), track: undefined}),
        verifyOutcome: async (initialInfo, finalInfo) => {
          expect(finalInfo.screenWakeLock).not.toBe(initialInfo.screenWakeLock);

          expect(initialInfo.screenWakeLock).toBeDefined();
          expect(initialInfo.screenWakeLock!.released).toBe(true);

          expect(finalInfo.screenWakeLock).toBeUndefined();
          expect(finalInfo.track).toBeDefined();
          expect(finalInfo.track!.isTorchOn()).toBe(false);
        },
      },
      {
        description: '(state: On, track: none)',
        initialState: State.On,

        getInitialPartialInfo: () => ({screenWakeLock: createMockWakeLock(), track: undefined}),
        verifyOutcome: async (initialInfo, finalInfo) => {
          expect(finalInfo.screenWakeLock).not.toBe(initialInfo.screenWakeLock);

          expect(initialInfo.screenWakeLock).toBeDefined();
          expect(initialInfo.screenWakeLock!.released).toBe(true);

          expect(finalInfo.screenWakeLock).toBeDefined();
          expect(finalInfo.screenWakeLock!.released).toBe(false);
          expect(finalInfo.track).toBeDefined();
          expect(finalInfo.track!.isTorchOn()).toBe(true);
        },
      },
      {
        description: '(state: Off, track: stopped)',
        initialState: State.Off,

        getInitialPartialInfo: () => ({screenWakeLock: createMockWakeLock(), track: createMockTrack(true)}),
        verifyOutcome: async (initialInfo, finalInfo) => {
          expect(finalInfo.screenWakeLock).not.toBe(initialInfo.screenWakeLock);
          expect(finalInfo.track).not.toBe(initialInfo.track);

          expect(initialInfo.screenWakeLock).toBeDefined();
          expect(initialInfo.screenWakeLock!.released).toBe(true);
          expect(initialInfo.track).toBeDefined();
          expect(initialInfo.track!.readyState).toBe('ended');

          expect(finalInfo.screenWakeLock).toBeUndefined();
          expect(finalInfo.track).toBeDefined();
          expect(finalInfo.track!.readyState).toBe('live');
          expect(finalInfo.track!.isTorchOn()).toBe(false);
        },
      },
      {
        description: '(state: On, track: stopped)',
        initialState: State.On,

        getInitialPartialInfo: () => ({screenWakeLock: createMockWakeLock(), track: createMockTrack(true)}),
        verifyOutcome: async (initialInfo, finalInfo) => {
          expect(finalInfo.screenWakeLock).not.toBe(initialInfo.screenWakeLock);
          expect(finalInfo.track).not.toBe(initialInfo.track);

          expect(initialInfo.screenWakeLock).toBeDefined();
          expect(initialInfo.screenWakeLock!.released).toBe(true);
          expect(initialInfo.track).toBeDefined();
          expect(initialInfo.track!.readyState).toBe('ended');

          expect(finalInfo.screenWakeLock).toBeDefined();
          expect(finalInfo.screenWakeLock!.released).toBe(false);
          expect(finalInfo.track).toBeDefined();
          expect(finalInfo.track!.readyState).toBe('live');
          expect(finalInfo.track!.isTorchOn()).toBe(true);
        },
      },
      {
        description: '(state: Off, track: active)',
        initialState: State.Off,

        getInitialPartialInfo: () => ({screenWakeLock: createMockWakeLock(), track: createMockTrack()}),
        verifyOutcome: async (initialInfo, finalInfo) => {
          expect(finalInfo.screenWakeLock).not.toBe(initialInfo.screenWakeLock);
          expect(finalInfo.track).not.toBe(initialInfo.track);

          expect(initialInfo.screenWakeLock).toBeDefined();
          expect(initialInfo.screenWakeLock!.released).toBe(true);
          expect(initialInfo.track).toBeDefined();
          expect(initialInfo.track!.readyState).toBe('ended');

          expect(finalInfo.screenWakeLock).toBeUndefined();
          expect(finalInfo.track).toBeDefined();
          expect(finalInfo.track!.readyState).toBe('live');
          expect(finalInfo.track!.isTorchOn()).toBe(false);
        },
      },
      {
        description: '(state: On, track: active)',
        initialState: State.On,

        getInitialPartialInfo: () => ({screenWakeLock: createMockWakeLock(), track: createMockTrack()}),
        verifyOutcome: async (initialInfo, finalInfo) => {
          expect(finalInfo.screenWakeLock).not.toBe(initialInfo.screenWakeLock);
          expect(finalInfo.track).not.toBe(initialInfo.track);

          expect(initialInfo.screenWakeLock).toBeDefined();
          expect(initialInfo.screenWakeLock!.released).toBe(true);
          expect(initialInfo.track).toBeDefined();
          expect(initialInfo.track!.readyState).toBe('ended');

          expect(finalInfo.screenWakeLock).toBeDefined();
          expect(finalInfo.screenWakeLock!.released).toBe(false);
          expect(finalInfo.track).toBeDefined();
          expect(finalInfo.track!.readyState).toBe('live');
          expect(finalInfo.track!.isTorchOn()).toBe(true);
        },
      },
    ];

    testCases.forEach(
        ({description, initialState, getInitialPartialInfo, verifyOutcome}) => describe(description, () => {
          let elem: TestTorchCe;
          let initialInfo: IMockPartialTorchInfo;

          beforeEach(async () => {
            initialInfo = getInitialPartialInfo();
            elem = await initCe(TestTorchCe);
            elem.state = initialState;
            elem.torchInfoPromise = Promise.resolve({
              hasCamera: true,
              hasTorch: !!(initialInfo.track && initialInfo.track.$capabilities.torch),
              screenWakeLock: initialInfo.screenWakeLock as unknown as WakeLockSentinel | undefined,
              track: initialInfo.track as unknown as MediaStreamTrack | undefined,
            });

            spyOn(TestTorchCe.prototype, 'acquireCameraPermission').and.resolveTo();
            spyOnProperty(WIN.navigator, 'mediaDevices').and.returnValue(new MockMediaDevices(new Map([
              [new TestDeviceInfo('videoinput', 'cam-001'), {torch: true}],
            ])) as unknown as MediaDevices);
            spyOnProperty(WIN.navigator, 'wakeLock').and.returnValue(new MockWakeLock());

            getTorchInfoSpy.and.callThrough();
            setMockHidden(false);
          });

          it('should do the right thing (TM)', async () => {
            setMockHidden(true);
            await elem.onVisibilityChange();

            setMockHidden(false);
            await elem.onVisibilityChange();

            const finalInfo = (await elem.torchInfoPromise) as unknown as IMockPartialTorchInfo;
            await verifyOutcome(initialInfo, finalInfo);
          });
        }));
  });

  describe('#releaseScreenWakeLock()', () => {
    let elem: TestTorchCe;
    let testTorchInfo: Parameters<TestTorchCe['releaseScreenWakeLock']>[0];

    beforeEach(() => {
      elem = new TestTorchCe();
      testTorchInfo = {
        hasCamera: false,
        hasTorch: false,
        screenWakeLock: new MockWakeLockSentinel('screen') as unknown as WakeLockSentinel,
        track: undefined,
      };
    });

    it('should release the screen wake lock', async () => {
      const wakeLock = testTorchInfo.screenWakeLock;
      const releaseSpy = spyOn(wakeLock!, 'release').and.callThrough();

      expect(wakeLock!.released).toBe(false);

      await elem.releaseScreenWakeLock(testTorchInfo);

      expect(releaseSpy).toHaveBeenCalledOnceWith();
      expect(wakeLock!.released).toBe(true);
      expect(testTorchInfo.screenWakeLock).toBeUndefined();
    });

    it('should not call `release()`, if screen wake lock is already released', async () => {
      const wakeLock = testTorchInfo.screenWakeLock;
      await wakeLock!.release();
      const releaseSpy = spyOn(wakeLock!, 'release').and.callThrough();

      expect(wakeLock!.released).toBe(true);

      await elem.releaseScreenWakeLock(testTorchInfo);

      expect(releaseSpy).not.toHaveBeenCalled();
      expect(wakeLock!.released).toBe(true);
      expect(testTorchInfo.screenWakeLock).toBeUndefined();
    });

    it('should not break, if there is no screen wake lock', async () => {
      testTorchInfo.screenWakeLock = undefined;

      await elem.releaseScreenWakeLock(testTorchInfo);

      expect(testTorchInfo.screenWakeLock).toBeUndefined();
    });
  });

  describe('#updateState()', () => {
    let elem: IInitializedCe<TestTorchCe>;

    beforeEach(async () => elem = await initCe(TestTorchCe));

    it('should update the internal state', async () => {
      await elem.updateState(State.Uninitialized);
      expect(elem.state).toBe(State.Uninitialized);

      await elem.updateState(State.Initializing);
      expect(elem.state).toBe(State.Initializing);

      await elem.updateState(State.Disabled);
      expect(elem.state).toBe(State.Disabled);

      await elem.updateState(State.Off);
      expect(elem.state).toBe(State.Off);

      await elem.updateState(State.On);
      expect(elem.state).toBe(State.On);
    });

    it('should switch the torch on/off, if a track is active', async () => {
      const mockTrack = new MockMediaStreamTrack(true);
      getTorchInfoSpy.and.resolveTo({hasTorch: true, track: mockTrack});

      await elem.updateState(State.Uninitialized);
      expect(mockTrack.isTorchOn()).toBe(false);

      await elem.updateState(State.On);
      expect(mockTrack.isTorchOn()).toBe(true);

      await elem.updateState(State.Initializing);
      expect(mockTrack.isTorchOn()).toBe(false);

      await elem.updateState(State.On);
      expect(mockTrack.isTorchOn()).toBe(true);

      await elem.updateState(State.Disabled);
      expect(mockTrack.isTorchOn()).toBe(false);

      await elem.updateState(State.On);
      expect(mockTrack.isTorchOn()).toBe(true);

      await elem.updateState(State.Off);
      expect(mockTrack.isTorchOn()).toBe(false);
    });

    it('should release the screen wake lock, if a track is active', async () => {
      const releaseScreenWakeLockSpy = spyOn(TestTorchCe.prototype, 'releaseScreenWakeLock');
      const mockTorchInfo = {
        hasCamera: false,
        hasTorch: false,
        screenWakeLock: undefined,
        track: new MockMediaStreamTrack() as unknown as MediaStreamTrack,
      };
      getTorchInfoSpy.and.resolveTo(mockTorchInfo);

      releaseScreenWakeLockSpy.calls.reset();
      await elem.updateState(State.Uninitialized);
      expect(releaseScreenWakeLockSpy).toHaveBeenCalledOnceWith(mockTorchInfo);

      releaseScreenWakeLockSpy.calls.reset();
      await elem.updateState(State.On);
      expect(releaseScreenWakeLockSpy).toHaveBeenCalledOnceWith(mockTorchInfo);

      releaseScreenWakeLockSpy.calls.reset();
      await elem.updateState(State.Initializing);
      expect(releaseScreenWakeLockSpy).toHaveBeenCalledOnceWith(mockTorchInfo);

      releaseScreenWakeLockSpy.calls.reset();
      await elem.updateState(State.On);
      expect(releaseScreenWakeLockSpy).toHaveBeenCalledOnceWith(mockTorchInfo);

      releaseScreenWakeLockSpy.calls.reset();
      await elem.updateState(State.Disabled);
      expect(releaseScreenWakeLockSpy).toHaveBeenCalledOnceWith(mockTorchInfo);

      releaseScreenWakeLockSpy.calls.reset();
      await elem.updateState(State.On);
      expect(releaseScreenWakeLockSpy).toHaveBeenCalledOnceWith(mockTorchInfo);

      releaseScreenWakeLockSpy.calls.reset();
      await elem.updateState(State.Off);
      expect(releaseScreenWakeLockSpy).toHaveBeenCalledOnceWith(mockTorchInfo);
    });

    it('should not renew the track', async () => {
      await elem.updateState(State.On);
      expect(getTorchInfoSpy).toHaveBeenCalledWith();
    });

    it('should reject, if retrieving torch info fails', async () => {
      getTorchInfoSpy.and.rejectWith('test');
      const rejection = await reversePromise(elem.updateState(State.On));

      expect(rejection).toBe('test');
    });

    describe('loader', () => {
      let loader: HTMLElement;

      beforeEach(() => loader = elem.shadowRoot.querySelector<HTMLElement>('.loader')!);

      it('should be visible, while not initialized', async () => {
        const loaderStyle = WIN.getComputedStyle(loader);

        await elem.updateState(State.Uninitialized);
        expect(loaderStyle.display).toBe('block');

        await elem.updateState(State.Initializing);
        expect(loaderStyle.display).toBe('block');
      });

      it('should not be visible, while initialized', async () => {
        const loaderStyle = WIN.getComputedStyle(loader);

        await elem.updateState(State.Disabled);
        expect(loaderStyle.display).toBe('none');

        await elem.updateState(State.Off);
        expect(loaderStyle.display).toBe('none');

        await elem.updateState(State.On);
        expect(loaderStyle.display).toBe('none');
      });
    });

    describe('torch', () => {
      let torch: HTMLElement;

      beforeEach(() => torch = elem.shadowRoot.querySelector<HTMLElement>('.torch')!);

      it('should respond to click when on/off', async () => {
        const onClickSpy = spyOn(elem, 'onClick');

        await elem.updateState(State.Uninitialized);
        torch.click();
        expect(onClickSpy).not.toHaveBeenCalled();

        await elem.updateState(State.Initializing);
        torch.click();
        expect(onClickSpy).not.toHaveBeenCalled();

        await elem.updateState(State.Disabled);
        torch.click();
        expect(onClickSpy).not.toHaveBeenCalled();

        await elem.updateState(State.Off);
        torch.click();
        expect(onClickSpy).toHaveBeenCalledTimes(1);

        await elem.updateState(State.On);
        torch.click();
        expect(onClickSpy).toHaveBeenCalledTimes(2);

        await elem.updateState(State.Off);
        torch.click();
        expect(onClickSpy).toHaveBeenCalledTimes(3);

        await elem.updateState(State.Disabled);
        torch.click();
        expect(onClickSpy).toHaveBeenCalledTimes(3);

        await elem.updateState(State.On);
        torch.click();
        expect(onClickSpy).toHaveBeenCalledTimes(4);
      });

      it('should have the appropriate classes', async () => {
        const allClasses = ['uninitialized', 'initializing', 'disabled', 'off'];
        const test = async (state: State, ...classes: string[]) => {
          elem.classList.add(...allClasses);
          await elem.updateState(state);

          allClasses.forEach(cls =>
            expect(torch.classList.contains(cls)).toBe(classes.includes(cls), cls));

          elem.classList.remove(...allClasses);
          await elem.updateState(state);

          allClasses.forEach(cls =>
            expect(torch.classList.contains(cls)).toBe(classes.includes(cls), cls));
        };

        await test(State.Uninitialized, 'uninitialized', 'off');
        await test(State.Initializing, 'initializing', 'off');
        await test(State.Disabled, 'disabled', 'off');
        await test(State.Off, 'off', 'off');
        await test(State.On);
      });

      it('should have the appropriate style', async () => {
        const torchStyle = WIN.getComputedStyle(torch);

        await elem.updateState(State.Uninitialized);
        expect(torchStyle.cursor).toBe('pointer');
        expect(torchStyle.opacity).toBe('1');

        await elem.updateState(State.Initializing);
        expect(torchStyle.cursor).toBe('progress');
        expect(torchStyle.opacity).toBe('1');

        await elem.updateState(State.Disabled);
        expect(torchStyle.cursor).toBe('not-allowed');
        expect(torchStyle.opacity).toBe('0.5');

        await elem.updateState(State.Off);
        expect(torchStyle.cursor).toBe('pointer');
        expect(torchStyle.opacity).toBe('1');

        await elem.updateState(State.On);
        expect(torchStyle.cursor).toBe('pointer');
        expect(torchStyle.opacity).toBe('1');
      });
    });

    describe('status', () => {
      let status: HTMLElement;
      let statusMsg: HTMLElement;
      let statusMsgExtra: HTMLElement;

      beforeEach(() => {
        status = elem.shadowRoot.querySelector<HTMLElement>('.status')!;
        statusMsg = status.querySelector<HTMLElement>('.status-message')!;
        statusMsgExtra = status.querySelector<HTMLElement>('.status-message-extra')!;
      });

      it('should display an appropriate message', async () => {
        await elem.updateState(State.Uninitialized);
        expect(normalizeWhitespace(statusMsg.textContent)).toBe('-');

        await elem.updateState(State.Initializing);
        expect(normalizeWhitespace(statusMsg.textContent)).toBe('INITIALIZING... ⏳');

        await elem.updateState(State.Disabled);
        expect(normalizeWhitespace(statusMsg.textContent)).toBe('NOT AVAILABLE 🚫');

        await elem.updateState(State.Off);
        expect(normalizeWhitespace(statusMsg.textContent)).toBe('OFF');

        await elem.updateState(State.On);
        expect(normalizeWhitespace(statusMsg.textContent)).toBe('ON');
      });

      it('should display an extra message, if provided', async () => {
        await elem.updateState(State.On, 'Extra on.');
        expect(normalizeWhitespace(statusMsg.textContent)).toBe('ON');
        expect(normalizeWhitespace(statusMsgExtra.textContent)).toBe('Extra on.');

        await elem.updateState(State.Off);
        expect(normalizeWhitespace(statusMsg.textContent)).toBe('OFF');
        expect(normalizeWhitespace(statusMsgExtra.textContent)).toBe('');
      });
    });
  });

  // Helpers
  class MockMediaDevices implements Pick<MediaDevices, 'enumerateDevices' | 'getUserMedia'> {
    constructor(public $devicesWithSpecs = new Map([
      [new TestDeviceInfo('audiooutput', 'spkr-001'), {}],
      [new TestDeviceInfo('audioinput', 'mic-001'), {}],
      [new TestDeviceInfo('videoinput', 'cam-001'), {}],
      [new TestDeviceInfo('videoinput', 'cam-002'), {torch: true}],
    ])) {
    }

    public async enumerateDevices(): Promise<MediaDeviceInfo[]> {
      return [...this.$devicesWithSpecs.keys()];
    }

    public async getUserMedia(constraints?: MediaStreamConstraints | undefined): Promise<MediaStream> {
      const {audio = false, video = false} = constraints ?? {};

      if (!audio && !video) {
        throw new DOMException('No user media satisfies the constraints.', 'NotFoundError');
      }

      if (!video) {
        throw new Error('Audio-only user media not supported by mock implementation.');
      }

      const cameras = (await this.enumerateDevices()).filter(x => x.kind === 'videoinput');
      let matchedCamera: MediaDeviceInfo | null = null;

      if ((video === true) || (video.deviceId === undefined)) {
        matchedCamera = cameras[0] ?? null;
      } else if (typeof video.deviceId === 'string') {
        matchedCamera = cameras.find(x => x.deviceId === video.deviceId) ?? null;
      } else if (Array.isArray(video.deviceId) || Array.isArray(video.deviceId?.exact) ||
          Array.isArray(video.deviceId?.ideal)) {
        throw new Error('Array constraints not supported by mock implementation.');
      } else if (video.deviceId.exact !== undefined) {
        const exactId = video.deviceId.exact;
        matchedCamera = cameras.find(x => x.deviceId === exactId) ?? null;
      } else if (video.deviceId.ideal !== undefined) {
        const idealId = video.deviceId.ideal;
        matchedCamera = cameras.find(x => x.deviceId === idealId) ?? cameras[0] ?? null;
      }

      if (matchedCamera === null) {
        throw new DOMException('No user media satisfies the constraints.', 'NotFoundError');
      }

      const mockTrack = new MockMediaStreamTrack(this.$devicesWithSpecs.get(matchedCamera)?.torch);
      return new MockMediaStream(mockTrack) as unknown as MediaStream;
    }
  }

  class MockMediaStream implements Pick<MediaStream, 'getVideoTracks'> {
    constructor(public $track = new MockMediaStreamTrack()) {
    }

    public getVideoTracks(): MediaStreamTrack[] {
      return [this.$track as unknown as MediaStreamTrack];
    }
  }

  class MockMediaStreamTrack implements Pick<MediaStreamTrack, 'applyConstraints' | 'getCapabilities' | 'stop'> {
    public readyState: MediaStreamTrackState = 'live';
    public readonly $capabilities: MediaTrackCapabilities = {};
    public $constraints: MediaTrackConstraints = {};

    constructor(private readonly hasTorch = false) {
      this.$capabilities.torch = this.hasTorch;
    }

    public async applyConstraints(constraints: MediaTrackConstraints): Promise<void> {
      this.$constraints = constraints;
    }

    public getCapabilities(): MediaTrackCapabilities {
      return this.$capabilities;
    }

    public isTorchOn(): boolean {
      return !!(this.$capabilities.torch && this.$constraints.advanced?.some(x => x.torch));
    }

    public stop(): void {
      this.readyState = 'ended';
    }
  }

  class MockPermissionStatus extends EventTarget implements PermissionStatus {
    public readonly name = 'mock';
    public readonly onchange = null;

    constructor(public readonly state: PermissionState) {
      super();
    }
  }

  class MockWakeLock implements WakeLock {
    public async request(type: WakeLockType = 'screen'): Promise<WakeLockSentinel> {
      return new MockWakeLockSentinel(type) as unknown as WakeLockSentinel;
    }
  }

  class MockWakeLockSentinel implements Pick<WakeLockSentinel, 'release' | 'released' | 'type'> {
    public released = false;

    constructor(public readonly type: WakeLockType) {
    }

    public async release(): Promise<void> {
      this.released = true;
    }
  }

  class TestDeviceInfo implements MediaDeviceInfo {
    public readonly label: string;

    constructor(
        public readonly kind: MediaDeviceKind,
        public readonly deviceId: string,
        public readonly groupId = 'group-default') {
      this.label = `${this.kind} ${this.deviceId} (${this.groupId})`;
    }

    public toJSON(): object {
      return this;
    }
  }

  class TestTorchCe extends TorchCe {
    declare public state: TorchCe['state'];
    declare public torchInfoPromise: TorchCe['torchInfoPromise'];

    public override acquireCameraPermission(): Promise<void> {
      return super.acquireCameraPermission();
    }

    public override getTorchInfo(...args: Parameters<TorchCe['getTorchInfo']>) {
      return super.getTorchInfo(...args);
    }

    public override onClick(...args: Parameters<TorchCe['onClick']>) {
      return super.onClick(...args);
    }

    public override onError(...args: Parameters<TorchCe['onError']>) {
      return super.onError(...args);
    }

    public override onVisibilityChange(...args: Parameters<TorchCe['onVisibilityChange']>) {
      return super.onVisibilityChange(...args);
    }

    public override releaseScreenWakeLock(...args: Parameters<TorchCe['releaseScreenWakeLock']>) {
      return super.releaseScreenWakeLock(...args);
    }

    public override updateState(...args: Parameters<TorchCe['updateState']>) {
      return super.updateState(...args);
    }
  }
});
