import React, { useEffect } from 'react'
import { State } from '../store'
import { useSelector } from 'react-redux'
import { REGEX_LAST_PATH } from '../constants'
import { useParams, useHistory, useLocation, Switch, Route, Redirect } from 'react-router-dom'
import { OnboardRegistration } from '../components/OnboardRegisteration'
import { OnboardScanning } from '../components/OnboardScanning'
import { OnboardWifi } from '../components/OnboardWifi'
import { Body } from '../components/Body'
import { Icon } from '../components/Icon'
import { Box } from '@mui/material'

const steps = ['/scanning', '/wifi', '/configuring']

export const OnboardRouter: React.FC = () => {
  const history = useHistory()
  const location = useLocation()
  const { platform } = useParams<{ platform?: string }>()
  const bluetooth = useSelector((state: State) => state.bluetooth)
  const step = Math.max(steps.indexOf(location.pathname.match(REGEX_LAST_PATH)?.[0] || ''), 0)

  useEffect(() => {
    if (step !== 0 && (!bluetooth.initialized || !bluetooth.connected)) {
      history.push(`/onboard/${platform}${steps[0]}`)
    }
  }, [bluetooth])

  const onNext = () => {
    const nextStep = step >= steps.length ? 0 : step + 1
    history.push(`/onboard/${platform}${steps[nextStep]}`)
  }

  if (!platform) return <Redirect to={{ pathname: '/add', state: { isRedirect: true } }} />

  return (
    <Body verticalOverflow center gutterBottom gutterTop>
      <Box maxWidth={{ xs: 325, sm: 370 }} width={370} height="auto" paddingTop={4} paddingBottom={25}>
        <Icon name="bluetooth" fontSize={80} color="primary" inline />
        <Switch>
          <Route path={['/onboard/:platform', '/onboard/:platform/scanning']} exact>
            <OnboardScanning next={onNext} />
          </Route>
          <Route path="/onboard/:platform/wifi">
            <OnboardWifi next={onNext} />
          </Route>
          <Route path="/onboard/:platform/configuring">
            <OnboardRegistration />
          </Route>
        </Switch>
      </Box>
    </Body>
  )
}
