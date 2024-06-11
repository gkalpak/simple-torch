/* eslint-disable max-classes-per-file */

import {BaseCe, IInitializedCe} from '../../../../app/js/components/base.ce.js';
import {EMPTY_TRACK_INFO, State, TorchCe} from '../../../../app/js/components/layout/torch.ce.js';
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
  let getTrackInfoSpy: jasmine.Spy;
  let onErrorSpy: jasmine.Spy;

  beforeAll(() => TestTorchCe.register());

  beforeEach(() => {
    mockSettings = {muted: false, torchDeviceId: ''};
    spyOn(Settings, 'getInstance').and.returnValue(mockSettings);
    getTrackInfoSpy = spyOn(TestTorchCe.prototype, 'getTrackInfo').and.resolveTo(EMPTY_TRACK_INFO);
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

  describe('#getTrackInfo()', () => {
    let mockMediaDevices: MockMediaDevices;
    let getUserMediaSpy: jasmine.Spy;
    let acquireCameraPermissionSpy: jasmine.Spy;
    let elem: TestTorchCe;

    beforeEach(async () => {
      mockMediaDevices = new MockMediaDevices();

      spyOnProperty(WIN.navigator, 'mediaDevices').and.returnValue(mockMediaDevices as unknown as MediaDevices);
      getUserMediaSpy = spyOn(mockMediaDevices, 'getUserMedia').and.callThrough();
      acquireCameraPermissionSpy = spyOn(TestTorchCe.prototype, 'acquireCameraPermission').and.resolveTo();
      getTrackInfoSpy.and.callThrough();

      elem = new TestTorchCe();
    });

    describe('(with `renewIfNecessary: false`)', () => {
      it('should retrieve and return the existing track info', async () => {
        await initCe(elem);
        getUserMediaSpy.calls.reset();
        acquireCameraPermissionSpy.calls.reset();

        const trackInfo = await elem.getTrackInfo();

        expect(trackInfo).toEqual({hasCamera: true, hasTorch: true, track: jasmine.any(MockMediaStreamTrack)});
        expect(getUserMediaSpy).not.toHaveBeenCalled();
        expect(acquireCameraPermissionSpy).not.toHaveBeenCalled();
      });

      it('should return empty track info, if there is no track info', async () => {
        const trackInfo = await elem.getTrackInfo();

        expect(trackInfo).toEqual(EMPTY_TRACK_INFO);
        expect(getUserMediaSpy).not.toHaveBeenCalled();
        expect(acquireCameraPermissionSpy).not.toHaveBeenCalled();
      });

      it('should return empty track info, if the previous track has been stopped', async () => {
        await initCe(elem);
        const trackInfo1 = await elem.getTrackInfo();

        trackInfo1.track?.stop();
        getUserMediaSpy.calls.reset();
        acquireCameraPermissionSpy.calls.reset();

        const trackInfo2 = await elem.getTrackInfo();

        expect(trackInfo1).not.toEqual(EMPTY_TRACK_INFO);
        expect(trackInfo2).toEqual(EMPTY_TRACK_INFO);
        expect(getUserMediaSpy).not.toHaveBeenCalled();
        expect(acquireCameraPermissionSpy).not.toHaveBeenCalled();
      });
    });

    describe('(with `renewIfNecessary: true`)', () => {
      it('should get a new track, if there is currently no track', async () => {
        const trackInfo = await elem.getTrackInfo(true);

        expect(trackInfo).toEqual({hasCamera: true, hasTorch: true, track: jasmine.any(MockMediaStreamTrack)});
        expect(acquireCameraPermissionSpy).toHaveBeenCalledOnceWith();
        expect(getUserMediaSpy).toHaveBeenCalledWith({video: {deviceId: {exact: jasmine.any(String)}}});
      });

      it('should return the same track info, if no renewal is required', async () => {
        const trackInfo1 = await elem.getTrackInfo(true);

        acquireCameraPermissionSpy.calls.reset();
        getUserMediaSpy.calls.reset();

        const trackInfo2 = await elem.getTrackInfo(true);

        expect(trackInfo2).toBe(trackInfo1);
        expect(trackInfo2).toEqual({hasCamera: true, hasTorch: true, track: jasmine.any(MockMediaStreamTrack)});
        expect(acquireCameraPermissionSpy).not.toHaveBeenCalled();
        expect(getUserMediaSpy).not.toHaveBeenCalled();
      });

      it('should renew the track, if the previous track has been stopped', async () => {
        const trackInfo1 = await elem.getTrackInfo(true);

        trackInfo1.track?.stop();
        acquireCameraPermissionSpy.calls.reset();
        getUserMediaSpy.calls.reset();

        const trackInfo2 = await elem.getTrackInfo(true);

        expect(trackInfo2).not.toBe(trackInfo1);
        expect(trackInfo2).toEqual({hasCamera: true, hasTorch: true, track: jasmine.any(MockMediaStreamTrack)});
        expect(acquireCameraPermissionSpy).toHaveBeenCalledOnceWith();
        expect(getUserMediaSpy).toHaveBeenCalledWith({video: {deviceId: {exact: jasmine.any(String)}}});
      });

      it('should reject if permission to camera is denied', async () => {
        acquireCameraPermissionSpy.and.rejectWith('Permission denied.');

        await expectAsync(elem.getTrackInfo(true)).toBeRejectedWith('Permission denied.');
      });

      it('should return empty track info, if there is no camera', async () => {
        mockMediaDevices.$devicesWithSpecs = new Map([
          [new TestDeviceInfo('audiooutput', 'spkr-001'), {}],
          [new TestDeviceInfo('audiooutput', 'spkr-002'), {}],
          [new TestDeviceInfo('audioinput', 'mic-001'), {}],
          [new TestDeviceInfo('audioinput', 'mic-002'), {}],
        ]);

        expect(await elem.getTrackInfo(true)).toEqual({hasCamera: false, hasTorch: false, track: undefined});
      });

      it('should return empty track info, if there is no camera with torch', async () => {
        mockMediaDevices.$devicesWithSpecs = new Map([
          [new TestDeviceInfo('videoinput', 'cam-001'), {}],
          [new TestDeviceInfo('videoinput', 'cam-002'), {}],
        ]);

        expect(await elem.getTrackInfo(true)).toEqual({hasCamera: true, hasTorch: false, track: undefined});
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

        await elem.getTrackInfo(true);

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

        await elem.getTrackInfo(true);

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

        await elem.getTrackInfo(true);

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

        await elem.getTrackInfo(true);
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

        await elem.getTrackInfo(true);
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

        await elem.getTrackInfo(true);

        expect(mockSettings.torchDeviceId).toBe('cam-002');
      });

      it('should try a stored matched video input device from settings first', async () => {
        mockSettings.torchDeviceId = 'cam-002';
        mockMediaDevices.$devicesWithSpecs = new Map([
          [new TestDeviceInfo('videoinput', 'cam-001'), {}],
          [new TestDeviceInfo('videoinput', 'cam-002'), {torch: true}],
          [new TestDeviceInfo('videoinput', 'cam-003'), {}],
        ]);

        await elem.getTrackInfo(true);

        expect(mockSettings.torchDeviceId).toBe('cam-002');
        expect(getUserMediaSpy).toHaveBeenCalledOnceWith({video: {deviceId: {exact: 'cam-002'}}});
      });

      it('should try other devices if a stored matched video input device from settings does not work', async () => {
        mockSettings.torchDeviceId = 'cam-003';
        mockMediaDevices.$devicesWithSpecs = new Map([
          [new TestDeviceInfo('videoinput', 'cam-001'), {}],
          [new TestDeviceInfo('videoinput', 'cam-002'), {torch: true}],
          [new TestDeviceInfo('videoinput', 'cam-003'), {}],
          [new TestDeviceInfo('videoinput', 'cam-004'), {}],
        ]);

        await elem.getTrackInfo(true);

        expect(getUserMediaSpy).toHaveBeenCalledTimes(4);
        expect(getUserMediaSpy).toHaveBeenCalledWith({video: {deviceId: {exact: 'cam-003'}}});
        expect(getUserMediaSpy).toHaveBeenCalledWith({video: {deviceId: {exact: 'cam-004'}}});
        expect(getUserMediaSpy).toHaveBeenCalledWith({video: {deviceId: {exact: 'cam-003'}}});
        expect(getUserMediaSpy).toHaveBeenCalledWith({video: {deviceId: {exact: 'cam-002'}}});
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
      expect(setStateSpy).toHaveBeenCalledBefore(getTrackInfoSpy);
    });

    it('should retrieve the track info', async () => {
      await initCe(elem);
      expect(getTrackInfoSpy).toHaveBeenCalledWith(true);
    });

    it('should report an error, if retrieving the track info fails', async () => {
      getTrackInfoSpy.and.throwError('`getTrackInfo()` failed');
      await initCe(elem);

      expect(onErrorSpy).toHaveBeenCalledWith(new Error('`getTrackInfo()` failed'));
    });

    it('should report an error, if switching the torch on fails', async () => {
      const mockTrack = new MockMediaStreamTrack(true);

      spyOn(mockTrack, 'applyConstraints').and.throwError('`applyConstraints()` failed');
      getTrackInfoSpy.and.resolveTo({hasTorch: true, track: mockTrack});

      await initCe(elem);

      expect(onErrorSpy).toHaveBeenCalledWith(new Error('`applyConstraints()` failed'));
    });

    describe('(with camera/torch/permission)', () => {
      let mockTrack: MockMediaStreamTrack;
      let onVisibilityChangeSpy: jasmine.Spy;

      beforeEach(() => {
        mockTrack = new MockMediaStreamTrack(true);

        onVisibilityChangeSpy = spyOn(elem, 'onVisibilityChange');
        getTrackInfoSpy.and.resolveTo({hasCamera: true, hasTorch: true, track: mockTrack});
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
    });

    describe('(without camera/torch/permission)', () => {
      let onVisibilityChangeSpy: jasmine.Spy;

      beforeEach(() => onVisibilityChangeSpy = spyOn(elem, 'onVisibilityChange'));

      it('should abort and report an error, when no torch detected', async () => {
        getTrackInfoSpy.and.resolveTo({hasCamera: true, hasTorch: false, track: new MockMediaStreamTrack()});

        await initCe(elem);
        WIN.document.dispatchEvent(new Event('visibilitychange'));

        expect(elem.state).not.toBe(State.On);
        expect(onVisibilityChangeSpy).not.toHaveBeenCalled();
        expect(onErrorSpy).toHaveBeenCalledWith(new Error('Unable to detect torch on your device.'));
      });

      it('should abort and report an error, when no camera detected', async () => {
        getTrackInfoSpy.and.resolveTo(EMPTY_TRACK_INFO);

        await initCe(elem);
        WIN.document.dispatchEvent(new Event('visibilitychange'));

        expect(elem.state).not.toBe(State.On);
        expect(onVisibilityChangeSpy).not.toHaveBeenCalled();
        expect(onErrorSpy).toHaveBeenCalledWith(new Error('Unable to detect camera on your device.'));
      });

      it('should abort and report an error, when permission not granted', async () => {
        const mockError = new Error('Permission not granted.');
        getTrackInfoSpy.and.throwError(mockError);

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
      getTrackInfoSpy.and.resolveTo({track: mockTrack});

      expect(mockTrack.readyState).toBe('live');

      await elem.onError(new Error('test'));
      expect(mockTrack.readyState).toBe('ended');
    });

    it('should set the state to `Disabled`', async () => {
      const updateStateSpy = spyOn(elem, 'updateState');
      await elem.onError(new Error('test'));

      expect(updateStateSpy).toHaveBeenCalledWith(State.Disabled, 'test');
    });
  });

  describe('#onVisibilityChange()', () => {
    interface IOnVisibilityChangeTestCase {
      description: string;
      initialState: State;
      getInitialTrack: () => MockMediaStreamTrack | undefined;
      verifyOutcome: (initialTrack?: MockMediaStreamTrack, lastTrack?: MockMediaStreamTrack) => Promise<void>;
    }

    const {setMockValue: setMockHidden} = mockProperty(WIN.document, 'hidden');
    const createMockTrack = (stopped = false) =>
      Object.assign(new MockMediaStreamTrack(true), stopped && {readyState: 'ended'});
    const testCases: IOnVisibilityChangeTestCase[] = [
      {
        description: '(state: Off, track: none)',
        initialState: State.Off,

        getInitialTrack: () => undefined,
        verifyOutcome: async (_initialTrack, lastTrack) => {
          expect(lastTrack).toBeDefined();
          expect(lastTrack!.isTorchOn()).toBe(false);
        },
      },
      {
        description: '(state: On, track: none)',
        initialState: State.On,

        getInitialTrack: () => undefined,
        verifyOutcome: async (_initialTrack, lastTrack) => {
          expect(lastTrack).toBeDefined();
          expect(lastTrack!.isTorchOn()).toBe(true);
        },
      },
      {
        description: '(state: Off, track: stopped)',
        initialState: State.Off,

        getInitialTrack: () => createMockTrack(true),
        verifyOutcome: async (initialTrack, lastTrack) => {
          expect(lastTrack).not.toBe(initialTrack);

          expect(initialTrack).toBeDefined();
          expect(initialTrack!.readyState).toBe('ended');

          expect(lastTrack).toBeDefined();
          expect(lastTrack!.readyState).toBe('live');
          expect(lastTrack!.isTorchOn()).toBe(false);
        },
      },
      {
        description: '(state: On, track: stopped)',
        initialState: State.On,

        getInitialTrack: () => createMockTrack(true),
        verifyOutcome: async (initialTrack, lastTrack) => {
          expect(lastTrack).not.toBe(initialTrack);

          expect(initialTrack).toBeDefined();
          expect(initialTrack!.readyState).toBe('ended');

          expect(lastTrack).toBeDefined();
          expect(lastTrack!.readyState).toBe('live');
          expect(lastTrack!.isTorchOn()).toBe(true);
        },
      },
      {
        description: '(state: Off, track: active)',
        initialState: State.Off,

        getInitialTrack: () => createMockTrack(),
        verifyOutcome: async (initialTrack, lastTrack) => {
          expect(lastTrack).not.toBe(initialTrack);

          expect(initialTrack).toBeDefined();
          expect(initialTrack!.readyState).toBe('ended');

          expect(lastTrack).toBeDefined();
          expect(lastTrack!.readyState).toBe('live');
          expect(lastTrack!.isTorchOn()).toBe(false);
        },
      },
      {
        description: '(state: On, track: active)',
        initialState: State.On,

        getInitialTrack: () => createMockTrack(),
        verifyOutcome: async (initialTrack, lastTrack) => {
          expect(lastTrack).not.toBe(initialTrack);

          expect(initialTrack).toBeDefined();
          expect(initialTrack!.readyState).toBe('ended');

          expect(lastTrack).toBeDefined();
          expect(lastTrack!.readyState).toBe('live');
          expect(lastTrack!.isTorchOn()).toBe(true);
        },
      },
    ];

    testCases.forEach(({description, initialState, getInitialTrack, verifyOutcome}) => describe(description, () => {
      let elem: TestTorchCe;
      let initialTrack: MockMediaStreamTrack | undefined;

      beforeEach(async () => {
        initialTrack = getInitialTrack();
        elem = await initCe(TestTorchCe);
        elem.state = initialState;
        elem.trackInfoPromise = Promise.resolve({
          hasCamera: true,
          hasTorch: !!(initialTrack && initialTrack.$capabilities.torch),
          track: initialTrack as unknown as MediaStreamTrack,
        });

        spyOn(TestTorchCe.prototype, 'acquireCameraPermission').and.resolveTo();
        spyOnProperty(WIN.navigator, 'mediaDevices').and.returnValue(new MockMediaDevices(new Map([
          [new TestDeviceInfo('videoinput', 'cam-001'), {torch: true}],
        ])) as unknown as MediaDevices);

        getTrackInfoSpy.and.callThrough();
        setMockHidden(false);
      });

      it('should do the right thing (TM)', async () => {
        setMockHidden(true);
        await elem.onVisibilityChange();

        setMockHidden(false);
        await elem.onVisibilityChange();

        const lastTrack = (await elem.trackInfoPromise).track as unknown as MockMediaStreamTrack;
        await verifyOutcome(initialTrack, lastTrack);
      });
    }));
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
      getTrackInfoSpy.and.resolveTo({hasTorch: true, track: mockTrack});

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

    it('should not renew the track', async () => {
      await elem.updateState(State.On);
      expect(getTrackInfoSpy).toHaveBeenCalledWith();
    });

    it('should reject, if retrieving track info fails', async () => {
      getTrackInfoSpy.and.rejectWith('test');
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

    public enumerateDevices(): Promise<MediaDeviceInfo[]> {
      return Promise.resolve([...this.$devicesWithSpecs.keys()]);
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

    public applyConstraints(constraints: MediaTrackConstraints): Promise<void> {
      this.$constraints = constraints;
      return Promise.resolve();
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
    declare public trackInfoPromise: TorchCe['trackInfoPromise'];

    public override acquireCameraPermission(): Promise<void> {
      return super.acquireCameraPermission();
    }

    public override getTrackInfo(...args: Parameters<TorchCe['getTrackInfo']>) {
      return super.getTrackInfo(...args);
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

    public override updateState(...args: Parameters<TorchCe['updateState']>) {
      return super.updateState(...args);
    }
  }
});
