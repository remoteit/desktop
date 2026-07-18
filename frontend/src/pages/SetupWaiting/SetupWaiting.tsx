import React, { useEffect } from 'react'
import { Box, Typography, CircularProgress, Divider } from '@mui/material'
import { State } from '../../store'
import { useSelector } from 'react-redux'
import { useHistory } from 'react-router-dom'
import { getDevices } from '../../selectors/devices'
import { DocsLinks } from '../../components/DocsLinks'
import { osName } from '@common/nameHelper'
import { Body } from '../../components/Body'
import { spacing } from '../../styling'

type Props = { os?: Ios }

export const SetupWaiting: React.FC<Props> = ({ os }) => {
  const { errorMessage, device } = useSelector((state: State) => ({
    errorMessage: state.ui.errorMessage,
    device: getDevices(state).find(d => d.thisDevice),
  }))
  const history = useHistory()

  useEffect(() => {
    if (device) {
      console.log('GO TO THIS DEVICE', device)
      history.push(`/devices/${device.id}`)
    }
  }, [device])

  if (errorMessage) history.push('/devices/setup')

  return (
    <Body center>
      <CircularProgress thickness={1.5} size={60} />
      <section>
        <Typography sx={{ marginTop: `${spacing.xl}px` }} variant="h3" align="center" gutterBottom>
          Your {osName(os)} is being registered with Remote.It
        </Typography>
      </section>
      <Box sx={{ width: 400, marginBottom: `${spacing.xl}px`, marginTop: `${spacing.md}px` }}>
        <Divider />
      </Box>
      <DocsLinks os={os} />
    </Body>
  )
}

