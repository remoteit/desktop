import escapeRegexp from 'escape-string-regexp'
import { initialize } from '@common/adaptor'
import { findType } from './models/applicationTypes'
import { store } from './store'

initialize({
  getState: getState,
  getCloudData: getCloudData,
  escapeRegex: escapeRegexp,
})

function getState() {
  return store.getState().backend
}

function getCloudData(typeId?: number) {
  return findType(store.getState().applicationTypes.all, typeId)
}
