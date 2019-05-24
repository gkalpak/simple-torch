type IPermissionName = 'accelerometer' | 'accessibility-events' | 'ambient-light-sensor' | 'accelerometer' |
                       'background-sync' | 'camera' | 'clipboard-read' | 'clipboard-write' | 'geolocation' |
                       'gyroscope' | 'magnetometer' | 'microphone' | 'midi' | 'notifications' | 'payment-handler' |
                       'persistent-storage' | 'push';

interface IPermissions {
  query(descriptor: {name: IPermissionName}): Promise<IPermissionStatus>;
}

interface IPermissionStatus {
  state: 'denied' | 'granted' | 'prompt';
}

interface MediaTrackCapabilities {
  torch?: boolean;
}

interface MediaTrackConstraintSet {
  torch?: boolean;
}

interface Navigator {
  permissions: IPermissions;
}
