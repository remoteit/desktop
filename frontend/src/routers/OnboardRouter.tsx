import React, { useState, useEffect } from 'react'
import { Dispatch } from '../store'
import { useDispatch } from 'react-redux'
import { REGEX_LAST_PATH } from '../constants'
import { useParams, useHistory, useLocation, Switch, Route } from 'react-router-dom'
import { OnboardConfiguring } from '../onboard/OnboardConfiguring'
import { OnboardScanning } from '../onboard/OnboardScanning'
import { LoadingMessage } from '../components/LoadingMessage'
import { OnboardWifi } from '../onboard/OnboardWifi'
import { Icon } from '../components/Icon'
import { Box } from '@mui/material'

const steps = ['/scanning', '/wifi', '/configuring']

export const OnboardRouter: React.FC = () => {
  const history = useHistory()
  const location = useLocation()
  const dispatch = useDispatch<Dispatch>()
  const { platform } = useParams<{ platform?: string }>()
  const [loading, setLoading] = useState<boolean>(true)
  const step = Math.max(steps.indexOf(location.pathname.match(REGEX_LAST_PATH)?.[0] || ''), 0)

  useEffect(() => {
    if (step >= steps.length) {
      setLoading(false)
      dispatch.ui.set({ successMessage: 'RaspberryPi onboarding complete!', redirect: '/devices' })
      history.push(`/onboard/${platform}${steps[0]}`)
    }
  }, [step])

  useEffect(() => {
    setTimeout(() => setLoading(false), 3000)
  }, [])

  const onNext = () => history.push(`/onboard/${platform}${steps[step + 1]}`)

  return (
    <LoadingMessage
      spinner={loading}
      logo={
        <Box marginX={2}>
          <Icon name={platform} fontSize={100} platformIcon />
        </Box>
      }
    >
      <Switch>
        <Route path={['/onboard/:platform', '/onboard/:platform/scanning']} exact>
          <OnboardScanning onNext={onNext} disabled={loading} />
        </Route>
        <Route path="/onboard/:platform/wifi">
          <OnboardWifi onNext={onNext} />
        </Route>
        <Route path="/onboard/:platform/configuring">
          <OnboardConfiguring onNext={onNext} platformId={platform} />
        </Route>
      </Switch>
    </LoadingMessage>
  )
}
