import { IDevice, IService, IUser } from 'remote.it'

export function device({ name = 'Mock Device', state = 'active', ...other }: Partial<IDevice> = {}): IDevice {
  return {
    id: `some-device-id-${randomNumber()}`,
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
    services: [service(), service({ name: 'Webcam', type: 'NX Witness' }), service({ name: 'HTTP', type: 'HTTP' })],
    ...other,
  }
}

export function service({ name = 'SSH', type = 'SSH', state = 'active', ...other }: Partial<IService> = {}): IService {
  return {
    contactedAt: new Date('mar 11 2019'),
    createdAt: new Date('aug 9, 2018'),
    id: `some-service-id-${randomNumber()}`,
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

export function user({ email = 'fake@example.com' } = {}): IUser {
  return {
    id: 'fake-user-id',
    email,
    username: email,
    authHash: 'fake-auth-hash',
    apiKey: 'fake-api-key',
    token: 'fake-token',
    pubSubChannel: 'fake-pubsub-channel',
    language: 'en-us',
    plan: {
      commercial: false,
      trial: false,
      name: 'free',
      price: 0,
      quantity: 0,
    },
  }
}

export function log(message = 'Some log messate'): Log {
  return {
    type: 'alert',
    message,
    data: { foo: 'bar' },
  }
}

export function connection(name = 'Some service name', port = 33001): IConnection {
  return {
    deviceID: 'some-device-id',
    id: 'some-service-id',
    name,
    port,
    owner: 'username',
    // pid?: number
  }
}

function randomNumber(start = 1, end = 1000) {
  return Math.floor(Math.random() * end) + start
}
