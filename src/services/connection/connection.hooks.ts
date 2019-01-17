import debug from 'debug'
import { HookContext } from '@feathersjs/feathers'

const d = debug('desktop:services:connection.hooks')

export default {
  before: {
    all: [
      (context: HookContext) =>
        d(`[BEFORE]: ${context.path}#${context.method}`),
    ],
    find: [],
    get: [],
    create: [],
    update: [],
    patch: [],
    remove: [],
  },

  after: {
    all: [
      (context: HookContext) => d(`[AFTER]: ${context.path}#${context.method}`),
    ],
    find: [],
    get: [],
    create: [],
    update: [],
    patch: [],
    remove: [],
  },

  error: {
    all: [(context: HookContext) => console.error('ERROR:', context.error)],
    find: [],
    get: [],
    create: [],
    update: [],
    patch: [],
    remove: [],
  },
}
