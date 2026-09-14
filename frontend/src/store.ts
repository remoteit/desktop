import { numericVersion } from './helpers/versionHelper'
import { models, RootModel } from './models'
import { defaultChatState, IChatState } from './models/chat'
import { isChatPopout } from './services/chatPopout'
import { createLogger, ReduxLoggerOptions } from 'redux-logger'
import { init, RematchDispatch, RematchRootState } from '@rematch/core'
import { createTransform, PersistConfig } from 'redux-persist'
import persistPlugin, { getPersistor } from '@rematch/persist'
import DateTransform from './helpers/DateTransform'
import immerPlugin from '@rematch/immer'
import localForage from 'localforage'

const loggerConfig: ReduxLoggerOptions = {
  predicate: () => !!(window as any).stateLogging,
}

// Persist only the durable chat fields — streaming/pendingConfirmation/error/
// health are runtime-only and must never survive a reload. ownerId IS durable: it is
// what syncIdentity compares against the signed-in user, so without it a reload resets
// ownerId to '' and the guard clears the transcript as if a different person had signed in.
const chatTransform = createTransform(
  (inbound: IChatState) => ({
    messages: inbound.messages,
    conversationId: inbound.conversationId,
    orgId: inbound.orgId,
    ownerId: inbound.ownerId,
    open: inbound.open,
    width: inbound.width,
    poppedOut: inbound.poppedOut,
  }),
  (outbound: Partial<IChatState>) => ({ ...defaultChatState, ...outbound }),
  { whitelist: ['chat'] }
)

// The chat popout is a SECOND full app instance on the same 'app' storage key. redux-persist
// with whitelist:[] does NOT disable writes — it still persists its _persist metadata (and an
// otherwise-empty state) to that shared key, clobbering the main window's cached accounts,
// devices, chat, etc. So the popout gets a storage adapter that reads/writes NOTHING: it adopts
// its transcript over the BroadcastChannel handoff and owns no durable state of its own.
const noopStorage = {
  getItem: () => Promise.resolve(null),
  setItem: () => Promise.resolve(),
  removeItem: () => Promise.resolve(),
}

const persistConfig: PersistConfig<RootModel> = {
  key: 'app',
  version: numericVersion(),
  // The popout persists nothing (noopStorage) so it cannot clobber the main window's 'app' key.
  storage: isChatPopout ? noopStorage : localForage,
  whitelist: isChatPopout
    ? []
    : [
        'accounts',
        'announcements',
        'applicationTypes',
        'chat',
        'connections',
        'contacts',
        'devices',
        'files',
        'jobs',
        'networks',
        'organization',
        'plans',
        'products',
        'sessions',
        'tags',
        'user',
      ],
  throttle: 1000,
  transforms: [DateTransform, chatTransform],
}

export const store = init<RootModel>({
  models,
  plugins: [immerPlugin(), persistPlugin(persistConfig)],
  // @ts-ignore
  redux: { middlewares: [createLogger(loggerConfig)] },
})

export const { dispatch } = store
export const persistor = getPersistor()

export type Store = typeof store
export type Dispatch = RematchDispatch<RootModel>
export type State = RematchRootState<RootModel>
