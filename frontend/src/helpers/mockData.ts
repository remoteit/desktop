import { IDevice, IService } from 'remote.it'

export function device({
  name = 'Mock Device',
  state = 'active',
  ...other
}: Partial<IDevice> = {}): IDevice {
  return {
    id: 'some-device-id',
    name,
    owner: 'foo@bar.com',
    state,
    hardwareID: 'some-hardward-id',
    lastExternalIP: '88.888.88.888',
    lastInternalIP: '10.0.1.125',
    region: 'us-west',
    createdAt: new Date('june 20, 2018'),
    contactedAt: new Date('jan 10, 2019'),
    shared: 'shared-from',
    services: [
      service(),
      service({ name: 'Webcam', type: 'NX Witness' }),
      service({ name: 'HTTP', type: 'HTTP' }),
    ],
    ...other,
  }
}

export function service({
  name = 'SSH',
  type = 'SSH',
  state = 'active',
  ...other
}: Partial<IService> = {}): IService {
  return {
    contactedAt: new Date('mar 11 2019'),
    createdAt: new Date('aug 9, 2018'),
    id: 'some-service-id',
    lastExternalIP: '77.777.77.777',
    name,
    protocol: 'nxwitness',
    region: 'us-west',
    state,
    type,
    deviceID: 'some-device-id',
    typeID: 30,
    ...other,
    // connection: {
    // expiresIn: number;
    // hostname: string;
    // id: string;
    // port: number | null;
    // protocol: string;
    // requestedAt: Date;
    // type: string;
    // url: string;
    // },
  }
}
