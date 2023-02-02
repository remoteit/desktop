import { REMOTEIT_PRODUCT_ID } from '../models/plans'
import { getPlansTests } from './state'
import { createSelector } from 'reselect'
import { selectOrganization } from './organizations'

export const selectLicenses = createSelector([getPlansTests, selectOrganization], (tests, organization) => {
  if (tests.license) return tests.licenses
  else return organization.licenses
})

export const selectRemoteitLicense = createSelector(
  [selectLicenses],
  (licenses): ILicense | null => licenses.find(l => l.plan.product.id === REMOTEIT_PRODUCT_ID) || null
)
