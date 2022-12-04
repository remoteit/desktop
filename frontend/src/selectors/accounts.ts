import { createSelector } from 'reselect'
import { ApplicationState } from '../store'

const getActiveId = (state: ApplicationState) => state.accounts.activeId
const optionalAccountId = (_: ApplicationState, accountId?: string) => accountId
export const getUserId = (state: ApplicationState) => state.auth.user?.id || ''

export const getActiveAccountId = createSelector(
  [getActiveId, getUserId, optionalAccountId],
  (activeId, userId, accountId) => accountId || activeId || userId
)

export const isUserAccount = createSelector(
  [getActiveAccountId, getUserId],
  (activeAccountId, userId) => activeAccountId === userId
)
