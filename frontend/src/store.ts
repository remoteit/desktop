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
// health are runtime-only and must never survive a reload
const chatTransform = createTransform(
  (inbound: IChatState) => ({
    messages: inbound.messages,
    conversationId: inbound.conversationId,
    orgId: inbound.orgId,
    open: inbound.open,
    expanded: inbound.expanded,
    width: inbound.width,
    poppedOut: inbound.poppedOut,
  }),
  (outbound: Partial<IChatState>) => ({ ...defaultChatState, ...outbound }),
  { whitelist: ['chat'] }
)

const persistConfig: PersistConfig<RootModel> = {
  key: 'app',
  version: numericVersion(),
  storage: localForage,
  // The chat popout window is a second full app instance on the same storage
  // key; it adopts its transcript over the BroadcastChannel handoff and must
  // never write, or the two windows clobber each other (last-writer-wins)
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
