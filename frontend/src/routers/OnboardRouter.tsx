import React, { useEffect } from 'react'
import browser from '../services/browser'
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
import { Pre } from '../components/Pre'

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
  const { notify, networks, ...rest } = bluetooth
  return (
    <Body verticalOverflow center gutterBottom gutterTop>
      <Box
        maxWidth={{ xs: 300, sm: 370 }}
        width={370}
        height="auto"
        paddingTop={4}
        paddingBottom={browser.isAndroid ? 25 : 4}
      >
        <Icon name={platform} fontSize={100} platformIcon inline />
        <Switch>
          <Route path={['/onboard/:platform', '/onboard/:platform/scanning']} exact>
            <OnboardScanning next={onNext} />
          </Route>
          <Route path="/onboard/:platform/wifi">
            <OnboardWifi next={onNext} />
          </Route>
          <Route path="/onboard/:platform/configuring">
            <OnboardRegistration platformId={platform} />
          </Route>
        </Switch>
      </Box>
      {/* <Pre>{rest}</Pre> */}
    </Body>
  )
}
