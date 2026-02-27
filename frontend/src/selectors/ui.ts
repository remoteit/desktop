import { Duration } from 'luxon'
import { createSelector } from 'reselect'
import { findLongestLength, defaultDeviceTimeSeries, defaultServiceTimeSeries } from '../helpers/dateHelper'
import {
  getDefaultSelected,
  getThemeDark,
  getUpdateStatus,
  getNotifiedVersion,
  getPreferences,
  getDeviceTimeSeries,
  getServiceTimeSeries,
  getUserAdmin,
} from './state'
import { selectActiveAccountId } from './accounts'
import { selectLimit } from './organizations'
import { getTheme } from '../styling/theme'
import { version } from '../helpers/versionHelper'

export const selectDefaultSelectedPage = createSelector(
  [selectActiveAccountId, getDefaultSelected],
  (activeAccountId, defaultSelected) => defaultSelected[activeAccountId] || {}
)

export const selectTheme = createSelector([getThemeDark], getTheme)

export const selectUpdateNotice = createSelector(
  [getUpdateStatus, getPreferences, getNotifiedVersion],
  (updateStatus, preferences, notifiedVersion) => {
    if (preferences.autoUpdate && updateStatus.downloaded && updateStatus.version !== version) {
      if (!notifiedVersion || notifiedVersion !== updateStatus.version) return updateStatus.version
    }
  }
)

export const selectTimeSeriesDefaults = createSelector([state => selectLimit(state, undefined, 'log-limit')], logLimit => ({
  deviceTimeSeries: {
    ...defaultDeviceTimeSeries,
    length: findLongestLength(Duration.fromISO(logLimit?.value), defaultDeviceTimeSeries.resolution),
  },
  serviceTimeSeries: {
    ...defaultServiceTimeSeries,
    length: findLongestLength(Duration.fromISO(logLimit?.value), defaultServiceTimeSeries.resolution),
  },
}))

export const selectTimeSeries = createSelector(
  [selectTimeSeriesDefaults, getDeviceTimeSeries, getServiceTimeSeries],
  (timeSeriesDefaults, deviceTimeSeries, serviceTimeSeries) => {
    return {
      deviceTimeSeries: deviceTimeSeries || timeSeriesDefaults.deviceTimeSeries,
      serviceTimeSeries: serviceTimeSeries || timeSeriesDefaults.serviceTimeSeries,
    }
  }
)


export const selectIsAdminRouteMode = createSelector(
  [getUserAdmin, (_state, pathname: string) => pathname],
  (userAdmin, pathname) => userAdmin && pathname.startsWith('/admin')
)
