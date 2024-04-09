import { numericVersion } from './helpers/versionHelper'
import { models, RootModel } from './models'
import { createLogger, ReduxLoggerOptions } from 'redux-logger'
import { init, RematchDispatch, RematchRootState } from '@rematch/core'
import { PersistConfig } from 'redux-persist'
import persistPlugin, { getPersistor } from '@rematch/persist'
import DateTransform from './helpers/DateTransform'
import immerPlugin from '@rematch/immer'
import localForage from 'localforage'

const loggerConfig: ReduxLoggerOptions = {
  predicate: () => !!(window as any).stateLogging,
}

const persistConfig: PersistConfig<RootModel> = {
  key: 'app',
  version: numericVersion(),
  storage: localForage,
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
  // @ts-ignore
  redux: { middlewares: [createLogger(loggerConfig)] },
})

export const { dispatch } = store
export const persistor = getPersistor()

export type Store = typeof store
export type Dispatch = RematchDispatch<RootModel>
export type State = RematchRootState<RootModel>
