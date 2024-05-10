import React, { useEffect } from 'react'
import { Dispatch } from '../store'
import { useDispatch } from 'react-redux'
import { REGEX_LAST_PATH } from '../constants'
import { useParams, useHistory, useLocation, Switch, Route, Redirect } from 'react-router-dom'
import { OnboardConfiguring } from '../onboard/OnboardConfiguring'
import { OnboardScanning } from '../onboard/OnboardScanning'
import { OnboardWifi } from '../onboard/OnboardWifi'
import { Body } from '../components/Body'
import { Icon } from '../components/Icon'
import { Box } from '@mui/material'

const steps = ['/scanning', '/wifi', '/configuring']

export const OnboardRouter: React.FC = () => {
  const history = useHistory()
  const location = useLocation()
  const dispatch = useDispatch<Dispatch>()
  const { platform } = useParams<{ platform?: string }>()
  const step = Math.max(steps.indexOf(location.pathname.match(REGEX_LAST_PATH)?.[0] || ''), 0)

  useEffect(() => {
    if (step >= steps.length) {
      dispatch.ui.set({ successMessage: 'RaspberryPi onboarding complete!', redirect: '/devices' })
      history.push(`/onboard/${platform}${steps[0]}`)
    }
  }, [step])

  const onNext = () => history.push(`/onboard/${platform}${steps[step + 1]}`)

  if (!platform) return <Redirect to={{ pathname: '/add', state: { isRedirect: true } }} />

  return (
    <Body center>
      <Box maxWidth={370}>
        <Icon name={platform} fontSize={100} platformIcon inline />
        <Switch>
          <Route path={['/onboard/:platform', '/onboard/:platform/scanning']} exact>
            <OnboardScanning onNext={onNext} />
          </Route>
          <Route path="/onboard/:platform/wifi">
            <OnboardWifi onNext={onNext} />
          </Route>
          <Route path="/onboard/:platform/configuring">
            <OnboardConfiguring onNext={onNext} platformId={platform} />
          </Route>
        </Switch>
      </Box>
    </Body>
  )
}
