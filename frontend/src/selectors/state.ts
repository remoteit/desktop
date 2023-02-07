import { ApplicationState } from '../store'

export const getUser = (state: ApplicationState) => state.auth.user || state.user
export const getUserId = (state: ApplicationState) => state.auth.user?.id || ''
export const getMemberships = (state: ApplicationState) => state.accounts.membership
export const optionalAccountId = (_: ApplicationState, accountId?: string) => accountId
export const getActiveId = (state: ApplicationState) => state.accounts.activeId
export const getPlansTests = (state: ApplicationState) => state.plans.tests
export const getLimitsOverride = (state: ApplicationState) => state.ui.limitsOverride
export const getOrganizations = (state: ApplicationState) => state.organization.accounts
export const getTestLimits = (state: ApplicationState) =>
  state.plans.tests.limit ? state.plans.tests.limits : undefined

export const getDevicesState = (state: ApplicationState) => state.devices
export const getColumns = (state: ApplicationState) => state.ui.columns
export const optionalId = (_: ApplicationState, accountId?: string, id?: string) => id
export const optionalDeviceId = (_: ApplicationState, accountId?: string, deviceId?: string) => deviceId

export const getAllConnections = (state: ApplicationState) => state.connections.all
export const optionalService = (_: ApplicationState, service?: IService) => service

export const getConnectionDefaults = (state: ApplicationState) => state.user.attributes?.connectionDefaults || {}
export const getApplicationParams = (_: ApplicationState, service?: IService, connection?: IConnection) => ({
  service,
  connection,
})

export const getAllNetworks = (state: ApplicationState) => state.networks.all
export const getTags = (state: ApplicationState) => state.tags.all
export const getDefaultSelected = (state: ApplicationState) => state.ui.defaultSelection
export const getThemeDark = (state: ApplicationState) => state.ui.themeDark
