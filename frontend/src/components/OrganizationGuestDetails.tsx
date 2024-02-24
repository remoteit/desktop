import React, { useEffect, useState } from 'react'
import { getAllDevices } from '../selectors/devices'
import { useSelector, useDispatch } from 'react-redux'
import { selectNetworks } from '../selectors/networks'
import { State, Dispatch } from '../store'
import { Typography, List, Box } from '@mui/material'
import { ListItemLocation } from './ListItemLocation'
import { TargetPlatform } from './TargetPlatform'
import { ShareDetails } from './ShareDetails'
import { Gutters } from './Gutters'
import { Icon } from './Icon'

type Props = {
  loaded: boolean
  guest?: IGuest
}

export const OrganizationGuestDetails: React.FC<Props> = ({ guest, loaded }) => {
  const dispatch = useDispatch<Dispatch>()
  const [fetched, setFetched] = useState<boolean>(false)

  const networks = useSelector((state: State) => selectNetworks(state))
  const devices = useSelector((state: State) => getAllDevices(state)).filter(device =>
    guest?.deviceIds.includes(device.id)
  )

  useEffect(() => {
    setFetched(false)
    const missing = guest?.deviceIds.filter(id => !devices.find(device => device.id === id))
    if (missing?.length && !fetched) {
      ;(async () => {
        await dispatch.devices.fetchDevices({ ids: missing, hidden: true })
        setFetched(true)
      })()
    }
  }, [guest])

  useEffect(() => {
    if (!loaded) dispatch.organization.fetchGuests()
  }, [guest])

  if (!guest?.deviceIds.length && !guest?.networkIds.length) return null

  return (
    <>
      <Gutters top="xl">
        <Typography variant="h2">Guest Access</Typography>
      </Gutters>
      {!!guest?.deviceIds.length && (
        <>
          <Typography variant="subtitle1">Devices</Typography>
          <List>
            {guest?.deviceIds.map(id => {
              const device = devices.find(d => d.id === id)
              return (
                <ListItemLocation
                  dense
                  key={id}
                  to={`/devices/${id}/users/${guest?.id}`}
                  icon={
                    device ? (
                      <TargetPlatform id={device?.targetPlatform} size="md" />
                    ) : fetched ? (
                      <Icon name="exclamation-triangle" />
                    ) : (
                      <Icon name="spinner-third" spin />
                    )
                  }
                  title={
                    device ? (
                      device.name
                    ) : (
                      <Box sx={{ opacity: 0.4 }}>{fetched ? `Loading failed (${id})` : 'loading...'}</Box>
                    )
                  }
                >
                  <ShareDetails user={guest} device={device} />
                </ListItemLocation>
              )
            })}
          </List>
        </>
      )}
      {!!guest?.networkIds.length && (
        <>
          <Typography variant="subtitle1">Networks</Typography>
          <List>
            {guest?.networkIds.map(id => {
              const network = networks.find(d => d.id === id)
              return (
                <ListItemLocation
                  key={id}
                  to={`/networks/${id}`}
                  icon={network ? <Icon name={network.icon} size="md" /> : <Icon name="spinner-third" spin />}
                  title={network ? network.name : <Box sx={{ opacity: 0.3 }}>loading...</Box>}
                />
              )
            })}
          </List>
        </>
      )}
    </>
  )
}
