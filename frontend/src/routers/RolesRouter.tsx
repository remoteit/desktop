import React from 'react'
import { Switch, Route, Redirect } from 'react-router-dom'
import { State } from '../store'
import { selectOrganization } from '../selectors/organizations'
import { OrganizationRolesPage } from '../pages/OrganizationRolesPage'
import { OrganizationRolePage } from '../pages/OrganizationRolePage'
import { DynamicPanel } from '../components/DynamicPanel'
import { useSelector } from 'react-redux'

export const RolesRouter: React.FC<{ layout: ILayout }> = ({ layout }) => {
  const organization = useSelector((state: State) => selectOrganization(state))

  return (
    <DynamicPanel
      primary={<OrganizationRolesPage />}
      secondary={
        <Switch>
          <Route path="/organization/roles/:roleID">
            <OrganizationRolePage />
          </Route>
          <Route path="/organization/roles">
            <Redirect
              to={{
                pathname: `/organization/roles/${organization?.roles.find(r => !r.disabled)?.id}`,
                state: { isRedirect: true },
              }}
            />
          </Route>
        </Switch>
      }
      layout={layout}
      root="/organization/roles"
    />
  )
}
