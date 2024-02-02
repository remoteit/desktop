import { models, RootModel } from './models'
import { createLogger, ReduxLoggerOptions } from 'redux-logger'
import { init, RematchDispatch, RematchRootState } from '@rematch/core'
import { PersistConfig } from 'redux-persist'
import persistPlugin, { getPersistor } from '@rematch/persist'
import DateTransform from './helpers/DateTransform'
import immerPlugin from '@rematch/immer'
import storage from 'redux-persist/lib/storage'

const loggerConfig: ReduxLoggerOptions = {
  predicate: () => !!(window as any).stateLogging,
}

const persistConfig: PersistConfig<RootModel> = {
  storage,
  key: 'app',
  version: 1,
  whitelist: [
    'accounts',
    'announcements',
    'applicationTypes',
    'connections',
    'contacts',
    'devices',
    'networks',
    'organization',
    'plans',
    'sessions',
    'tags',
    'user',
  ],
  throttle: 1000,
  transforms: [DateTransform],
}

export const store = init<RootModel>({
  models,
  plugins: [immerPlugin(), persistPlugin(persistConfig)],
  redux: { middlewares: [createLogger(loggerConfig)] },
})

export const { dispatch } = store
export const persistor = getPersistor() // Get and export the persistor

export type Store = typeof store
export type Dispatch = RematchDispatch<RootModel>
export type State = RematchRootState<RootModel>
