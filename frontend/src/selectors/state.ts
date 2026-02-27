import { State } from '../store'
import { getLocalStorage } from '../services/browser'
import { NOTICE_VERSION_ID } from '../models/backend'

export const optionalParam = (_: State, first?: any) => first
export const optionalSecondParam = (_: State, _first?: string, second?: any) => second
export const optionalThirdParam = (_: State, _first?: string, _second?: any, third?: any) => third

export const getUser = (state: State) => state.user
export const getUserAdmin = (state: State) => state.auth.user?.admin || false
export const getUserId = (state: State) => state.auth.user?.id || ''
export const getMemberships = (state: State) => state.accounts.membership
export const optionalAccountId = (_: State, accountId?: string) => accountId
export const optionalCustomerId = (_: State, _accountId?: string, customerId?: string) => customerId
export const getActiveId = (state: State) => state.accounts.activeId
export const getPlans = (state: State) => state.plans.plans
export const getPlansTests = (state: State) => state.plans.tests
export const getLimitsOverride = (state: State) => state.ui.limitsOverride
export const getOrganizations = (state: State) => state.organization.accounts
export const getTestLimits = (state: State) => (state.plans.tests.limit ? state.plans.tests.limits : undefined)

export const getDevicesState = (state: State) => state.devices
export const getColumns = (state: State) => state.ui.columns
export const optionalId = (_: State, _accountId?: string, id?: string) => id
export const optionalDeviceId = (_: State, _accountId?: string, deviceId?: string) => deviceId

export const getSessions = (state: State) => state.sessions.all
export const getConnections = (state: State) => state.connections.all
export const optionalService = (_: State, service?: IService) => service

export const getConnectionDefaults = (state: State) => state.user.attributes?.connectionDefaults || {}
export const getApplicationTypes = (state: State) => state.applicationTypes
export const getApplicationParams = (_: State, service?: IService, connection?: IConnection) => ({
  service,
  connection,
})

export const getAllNetworks = (state: State) => state.networks.all
export const getTags = (state: State) => state.tags.all
export const getDefaultSelected = (state: State) => state.ui.defaultSelection
export const getThemeDark = (state: State) => state.ui.themeDark
export const getDeviceTimeSeries = (state: State) => state.ui.deviceTimeSeries
export const getServiceTimeSeries = (state: State) => state.ui.serviceTimeSeries
export const getUpdateStatus = (state: State) => state.backend.updateStatus
export const getPreferences = (state: State) => state.backend.preferences
export const getAnnouncements = (state: State) => state.announcements.all
export const getNotifiedVersion = (state: State) => getLocalStorage(state, NOTICE_VERSION_ID)
export const getFiles = (state: State) => state.files.all
export const getJobs = (state: State) => state.jobs.all
