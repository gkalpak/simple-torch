import {BaseCe, IInitializedCe} from '../../../../app/components/base.ce.js';
import {EMPTY_TRACK_INFO, State, TorchCe} from '../../../../app/components/layout/torch.ce.js';
import {LoaderCe} from '../../../../app/components/shared/loader.ce.js';
import {EMOJI, WIN} from '../../../../app/shared/constants.js';
import {Settings} from '../../../../app/shared/settings.service.js';
import {Sounds} from '../../../../app/shared/sounds.service.js';
import {Utils} from '../../../../app/shared/utils.service.js';
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
  let permissionsQuerySpy: jasmine.Spy;
  let getTrackInfoSpy: jasmine.Spy;
  let onErrorSpy: jasmine.Spy;

  beforeAll(() => TestTorchCe.register());

  beforeEach(() => {
    permissionsQuerySpy = spyOn(WIN.navigator.permissions, 'query').and.resolveTo(new MockPermissionStatus('denied'));
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
    expect(torch.getAttribute('src')).toBe('/assets/images/simple-torch.svg');
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

  describe('#getTrackInfo()', () => {
    const utils = Utils.getInstance();
    let elem: TestTorchCe;
    let mockTrack: MockMediaStreamTrack;
    let utilsWaitAndCheckSpy: jasmine.Spy;
    let getUserMediaSpy: jasmine.Spy;

    beforeEach(async () => {
      elem = await initCe(TestTorchCe);
      mockTrack = new MockMediaStreamTrack();

      utilsWaitAndCheckSpy = spyOn(utils, 'waitAndCheck').and.resolveTo(false);
      getUserMediaSpy = spyOn(WIN.navigator.mediaDevices, 'getUserMedia').and.
        resolveTo({getVideoTracks: () => [mockTrack]} as unknown as MediaStream);

      getTrackInfoSpy.and.callThrough();
    });

    describe('(with `renewIfNecessary: false`)', () => {
      // Helpers
      const getTrackInfo = () => elem.getTrackInfo();

      it('should retrieve and return the existing track info', async () => {
        await elem.getTrackInfo(true);
        const trackInfo = await getTrackInfo();

        expect(trackInfo).toEqual({hasTorch: false, track: mockTrack as unknown as MediaStreamTrack});
      });

      it('should return empty track info, if there is no track info', async () => {
        const trackInfo = await getTrackInfo();

        expect(trackInfo).toEqual(EMPTY_TRACK_INFO);
        expect(getUserMediaSpy).not.toHaveBeenCalled();
      });

      it('should return empty track info, if the previous track has been stopped', async () => {
        const trackInfo1 = await elem.getTrackInfo(true);

        mockTrack.stop();
        getUserMediaSpy.calls.reset();
        const trackInfo2 = await getTrackInfo();

        expect(trackInfo1).not.toEqual(EMPTY_TRACK_INFO);
        expect(trackInfo2).toEqual(EMPTY_TRACK_INFO);
        expect(getUserMediaSpy).not.toHaveBeenCalled();
      });
    });

    describe('(with `renewIfNecessary: true`)', () => {
      // Helpers
      const getTrackInfo = () => elem.getTrackInfo(true);

      it('should retrieve and return the track info', async () => {
        const trackInfo = await getTrackInfo();

        expect(trackInfo).toEqual({hasTorch: false, track: mockTrack as unknown as MediaStreamTrack});
        expect(getUserMediaSpy).toHaveBeenCalledWith({video: {facingMode: 'environment'}});
      });

      it('should renew the track, if there is currently no track', async () => {
        const trackInfo1 = await elem.getTrackInfo();
        const trackInfo2 = await elem.getTrackInfo(true);

        expect(trackInfo1).toBe(EMPTY_TRACK_INFO);
        expect(trackInfo2).not.toEqual(trackInfo1);
      });

      it('should return the same track info, if no renewal is required', async () => {
        const trackInfo1 = await getTrackInfo();

        expect(getUserMediaSpy).toHaveBeenCalledTimes(1);

        getUserMediaSpy.calls.reset();
        const trackInfo2 = await getTrackInfo();

        expect(trackInfo2).toBe(trackInfo1);
        expect(getUserMediaSpy).not.toHaveBeenCalled();
      });

      it('should renew the track, if the previous track has been stopped', async () => {
        const trackInfo1 = await getTrackInfo();

        expect(getUserMediaSpy).toHaveBeenCalledTimes(1);

        mockTrack.stop();
        getUserMediaSpy.calls.reset();
        const trackInfo2 = await getTrackInfo();

        expect(trackInfo2).not.toBe(trackInfo1);
        expect(getUserMediaSpy).toHaveBeenCalledTimes(1);
      });

      it('should return empty track info, if `getUserMedia()` fails', async () => {
        getUserMediaSpy.and.rejectWith('test');
        const trackInfo = await getTrackInfo();

        expect(trackInfo).toEqual(EMPTY_TRACK_INFO);
      });

      it('should return empty track info, if `MediaStream` has no video tracks', async () => {
        getUserMediaSpy.and.resolveTo({getVideoTracks: () => []});
        const trackInfo = await getTrackInfo();

        expect(trackInfo).toEqual(EMPTY_TRACK_INFO);
      });

      it('should fail, if detecting torch support fails', async () => {
        utilsWaitAndCheckSpy.and.rejectWith('test');
        const rejection = await reversePromise(getTrackInfo());

        expect(rejection).toBe('test');
      });

      it('should detect whether the track supports torch', async () => {
        utilsWaitAndCheckSpy.and.resolveTo(true);
        const {hasTorch} = await getTrackInfo();

        expect(hasTorch).toBe(true);
        expect(utilsWaitAndCheckSpy).toHaveBeenCalledWith(100, 25, jasmine.any(Function));

        const checkHasTorchFn = utilsWaitAndCheckSpy.calls.mostRecent().args[2];
        expect(checkHasTorchFn()).toBe(false);

        mockTrack.$capabilities.torch = true;
        expect(checkHasTorchFn()).toBe(true);
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
        getTrackInfoSpy.and.resolveTo({hasTorch: true, track: mockTrack});
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

      it('should abort and report an error, when permission explicitly denied', async () => {
        permissionsQuerySpy.and.resolveTo(new MockPermissionStatus('denied'));

        await initCe(elem);
        WIN.document.dispatchEvent(new Event('visibilitychange'));

        expect(elem.state).not.toBe(State.On);
        expect(onVisibilityChangeSpy).not.toHaveBeenCalled();
        expect(onErrorSpy).toHaveBeenCalledWith(
            new Error('Access to camera denied. Please, give permission in browser settings.'));
      });

      it('should abort and report an error, when permission not granted', async () => {
        permissionsQuerySpy.and.resolveTo(new MockPermissionStatus('prompt'));

        await initCe(elem);
        WIN.document.dispatchEvent(new Event('visibilitychange'));

        expect(elem.state).not.toBe(State.On);
        expect(onVisibilityChangeSpy).not.toHaveBeenCalled();
        expect(onErrorSpy).toHaveBeenCalledWith(
            new Error('Access to camera not granted. Please, give permission when prompted.'));
      });

      it('should abort and report an error, when no camera detected', async () => {
        permissionsQuerySpy.and.resolveTo(new MockPermissionStatus('granted'));
        getTrackInfoSpy.and.resolveTo(EMPTY_TRACK_INFO);

        await initCe(elem);
        WIN.document.dispatchEvent(new Event('visibilitychange'));

        expect(elem.state).not.toBe(State.On);
        expect(onVisibilityChangeSpy).not.toHaveBeenCalled();
        expect(onErrorSpy).toHaveBeenCalledWith(new Error('Unable to detect camera on your device.'));
      });

      it('should abort and report an error, when no torch detected', async () => {
        permissionsQuerySpy.and.resolveTo(new MockPermissionStatus('granted'));
        getTrackInfoSpy.and.resolveTo({hasTorch: false, track: new MockMediaStreamTrack()});

        await initCe(elem);
        WIN.document.dispatchEvent(new Event('visibilitychange'));

        expect(elem.state).not.toBe(State.On);
        expect(onVisibilityChangeSpy).not.toHaveBeenCalled();
        expect(onErrorSpy).toHaveBeenCalledWith(new Error('Unable to detect torch on your device.'));
      });
    });
  });

  describe('#onClick()', () => {
    const {setMockValue: setMockMuted} = mockProperty(Settings.getInstance(), 'muted');
    const clickSound = Sounds.getInstance().getSound('/assets/audio/click.ogg', 0.15);
    let elem: TestTorchCe;
    let clickPlaySpy: jasmine.Spy;
    let updateStateSpy: jasmine.Spy;

    beforeEach(async () => {
      elem = await initCe(TestTorchCe);
      clickPlaySpy = spyOn(clickSound, 'play');
      updateStateSpy = spyOn(elem, 'updateState').and.resolveTo();
    });

    it('should play a click sound, unless muted', async () => {
      setMockMuted(false);

      await elem.onClick();
      expect(clickPlaySpy).toHaveBeenCalledTimes(1);

      await elem.onClick();
      expect(clickPlaySpy).toHaveBeenCalledTimes(2);

      setMockMuted(true);
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

        expect(updateStateSpy).toHaveBeenCalledTimes(1);
        expect(updateStateSpy).toHaveBeenCalledWith(newState);
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
          expect(lastTrack).toBe(initialTrack);

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
          hasTorch: !!(initialTrack && initialTrack.$capabilities.torch),
          track: initialTrack as unknown as MediaStreamTrack,
        });

        spyOn(WIN.navigator.mediaDevices, 'getUserMedia').and.callFake(() =>
          Promise.resolve({getVideoTracks: () => [new MockMediaStreamTrack(true)]} as unknown as MediaStream));

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
  class MockMediaStreamTrack {
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
      return !!this.$capabilities.torch &&
        !!this.$constraints.advanced &&
        this.$constraints.advanced.some(x => !!x.torch);
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

  class TestTorchCe extends TorchCe {
    declare public state: TorchCe['state'];
    declare public trackInfoPromise: TorchCe['trackInfoPromise'];

    public getTrackInfo(...args: Parameters<TorchCe['getTrackInfo']>) {
      return super.getTrackInfo(...args);
    }

    public onClick(...args: Parameters<TorchCe['onClick']>) {
      return super.onClick(...args);
    }

    public onError(...args: Parameters<TorchCe['onError']>) {
      return super.onError(...args);
    }

    public onVisibilityChange(...args: Parameters<TorchCe['onVisibilityChange']>) {
      return super.onVisibilityChange(...args);
    }

    public updateState(...args: Parameters<TorchCe['updateState']>) {
      return super.updateState(...args);
    }
  }
});
