import escapeRegex from 'escape-string-regexp'
import i18n from './i18n'
import { initialize } from '@common/adaptor'
import { findType } from './models/applicationTypes'
import { store } from './store'

function getState() {
  return store.getState().backend
}

function getCloudData(typeId?: number) {
  return findType(store.getState().applicationTypes.all, typeId)
}

initialize({
  getState,
  getCloudData,
  escapeRegex,
  translate: (key, defaultValue) => i18n.t(key, { defaultValue }),
})
