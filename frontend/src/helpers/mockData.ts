import { IUser } from 'remote.it'

export function service({ name = 'SSH', type = 'SSH', state = 'active', ...other }: Partial<IService> = {}): IService {
  return {
    contactedAt: new Date('mar 11 2019'),
    createdAt: new Date('aug 9, 2018'),
    lastReported: new Date('aug 9, 2018'),
    id: `some-service-id-${randomNumber()}`,
    name,
    state,
    type,
    deviceID: 'some-device-id',
    typeID: 30,
    sessions: [],
    access: [],
    attributes: {},
    ...other,
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
    id: `some-service-id-${randomNumber()}`,
    name,
    port,
    owner: { email: 'username', id: 'idstring' },
    online: true,
  }
}

function randomNumber(start = 1, end = 1000) {
  return Math.floor(Math.random() * end) + start
}
