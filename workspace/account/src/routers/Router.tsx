import React from 'react'
import { Switch, Route, Redirect, useHistory } from 'react-router-dom'

import { Overview } from '../pages/OverView'
import { Container } from '../components/Container'
import { ChangePassword } from '../pages/ChangePassword'
import { Profile } from '../pages/Profile'
import { Plans } from '../pages/Plans'
import { OtherPlans } from '../pages/OtherPlans'
import { SwitchPlans } from '../pages/SwitchPlans'
import { Notifications } from '../pages/Notifications'
import { Transactions } from '../pages/Transactions'
import { AccessKey } from '../pages/AccessKey'
import { RemoteWeb } from '../pages/RemoteWeb'

export const Router: React.FC = ({  }) => {
  
  const history = useHistory()
  
  return (
    <Switch>

      <Route path="/overview">
        <Container>
          <Overview />
        </Container>
      </Route>

      <Route path="/changePassword">
        <Container>
          <ChangePassword />
        </Container>
      </Route>

      <Route path="/profile">
        <Container>
          <Profile/>
        </Container>
      </Route>

      <Route path="/plans">
        <Container>
          <Plans/>
        </Container>
      </Route>
      
      <Route path="/otherPlans">
        <Container>
          <OtherPlans/>
        </Container>
      </Route>

      <Route path="/SwitchPlans">
        <Container>
          <SwitchPlans/>
        </Container>
      </Route>

      <Route path="/notificationSettings">
        <Container>
          <Notifications/>
        </Container>
      </Route>

      <Route path="/transactions">
        <Container>
          <Transactions/>
        </Container>
      </Route>

      <Route path="/accessKeys">
        <Container>
          <AccessKey/>
        </Container>
      </Route>

      <Route path="/remoteWeb">
        <Container>
          <RemoteWeb/>
        </Container>
      </Route>

      {/* Default */}
      <Route path="/">
        <Redirect to="/overview" />
      </Route>

    </Switch>
  )
}
