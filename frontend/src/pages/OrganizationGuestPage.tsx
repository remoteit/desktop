import React from 'react'
import { useParams } from 'react-router-dom'
import { useDispatch, useSelector } from 'react-redux'
import { Dispatch, ApplicationState } from '../store'
import { makeStyles, Typography, IconButton, Tooltip, CircularProgress } from '@material-ui/core'
import { Container } from '../components/Container'
import { Title } from '../components/Title'
import { Icon } from '../components/Icon'
import { spacing, fontSizes } from '../styling'
import { getDevices } from '../models/accounts'

export const OrganizationGuestPage: React.FC<{ device?: IDevice }> = ({ device }) => {
  const { userID = '' } = useParams<{ userID: string }>()
  // const { shares } = useDispatch<Dispatch>()
  const { devices } = useSelector((state: ApplicationState) => ({
    devices: getDevices(state).filter((d: IDevice) => !d.hidden),
  }))

  const css = useStyles()

  const guest: IGuest | undefined = devices.reduce((result: IGuest | undefined, device) => {
    device.access.forEach(({ id, email }) => {
      if (id !== userID) return
      if (result) result.devices.push(device)
      else result = { id, email, devices: [device] }
    })
    return result
  }, undefined)

  return (
    <Container
      header={
        <>
          <Typography variant="h1">
            <Title>{guest?.email}</Title>
          </Typography>
        </>
      }
    ></Container>
  )
}

const useStyles = makeStyles(({ palette }) => ({
  loading: { color: palette.danger.main, margin: spacing.sm },
}))
