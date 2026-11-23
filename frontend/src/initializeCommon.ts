import escapeRegex from 'escape-string-regexp'
import i18n from './i18n'
import { initialize } from '@common/adaptor'
import { store } from './store'

function getState() {
  return store.getState().backend
}

// The type itself or none: one the API does not list is not taken for another, which would make it web.
function getCloudData(typeId?: number) {
  return store.getState().applicationTypes.all.find(type => type.id === typeId)
}

initialize({
  getState,
  getCloudData,
  escapeRegex,
  translate: (key, defaultValue) => i18n.t(key, { defaultValue }),
})
