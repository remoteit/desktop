import React, { useState, useEffect } from 'react'
import { Dispatch } from '../store'
import { useDispatch } from 'react-redux'
import { useParams, useHistory, Switch, Route } from 'react-router-dom'
import { Typography, Stack, Box, Button, List, ListSubheader } from '@mui/material'
import { LoadingMessage } from '../components/LoadingMessage'
import { ListItemLink } from '../components/ListItemLink'
import { Icon } from '../components/Icon'

const steps = ['scanning', 'wifi', 'configuring']

export const OnboardRouter: React.FC = () => {
  const history = useHistory()
  const dispatch = useDispatch<Dispatch>()
  const { platform } = useParams<{ platform?: string }>()
  const [loading, setLoading] = useState<boolean>(true)
  const [step, setStep] = useState<number>(0)

  useEffect(() => {
    if (step >= steps.length) {
      setStep(0)
      setLoading(false)
      dispatch.ui.set({ successMessage: 'RaspberryPi onboarding complete!', redirect: '/devices' })
      history.push(`/onboard/${platform}/${steps[0]}`)
    }
  }, [step])

  const next = () => {
    const next = step + 1
    setStep(next)
    history.push(`/onboard/${platform}/${steps[next]}`)
  }

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
          <Box maxWidth={300}>
            <Box marginX={2}>
              <Stack flexDirection="row" alignItems="center" marginY={2}>
                <Icon name="bluetooth" type="brands" size="xl" color={true ? 'primary' : 'grayDark'} />
                <Typography variant="h2" marginLeft={1}>
                  Bluetooth Commissioning
                </Typography>
              </Stack>
              <Typography variant="body2">
                Start your Remote.It enabled Pi. It will be discoverable for one minute after startup.
              </Typography>
              <Button
                variant="contained"
                size="small"
                onClick={next}
                disabled={loading}
                sx={{ marginTop: 5, marginBottom: 4 }}
              >
                next
              </Button>
            </Box>
            <List>
              <ListSubheader disableGutters>Other options</ListSubheader>
              <ListItemLink
                dense
                icon="arrow-turn-down"
                iconProps={{ rotate: 270 }}
                href="http://remote.it/jumpbox"
                title="Purchase our JumpBox"
                disableGutters
              />
              <ListItemLink
                dense
                icon="arrow-down-to-bracket"
                href="http://remote.it/jumpbox"
                title="Download our Pi image"
                disableGutters
              />
              <ListItemLink
                dense
                icon="plus"
                href="http://remote.it/jumpbox"
                title="Add commissioning to an image"
                disableGutters
              />
            </List>
          </Box>
        </Route>
        <Route path="/onboard/:platform/wifi">
          <Typography variant="subtitle2">WiFi</Typography>
          <Typography variant="body2">To add bluetooth commissioning to your Raspberry Pi</Typography>
        </Route>
        <Route path="/onboard/:platform/configuring">
          <Typography variant="subtitle2">Configuring</Typography>
          <Typography variant="body2">To add bluetooth commissioning to your Raspberry Pi</Typography>
        </Route>
      </Switch>
    </LoadingMessage>
  )
}
